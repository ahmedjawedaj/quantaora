import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const workspaceRoot = path.resolve(appRoot, '..')
const srcRoot = path.join(appRoot, 'src')
const docsRoot = path.join(workspaceRoot, 'docs')
const graphPath = path.join(docsRoot, 'CODE-GRAPH.json')
const packsPath = path.join(docsRoot, 'AGENT-CONTEXT-PACKS.md')

const toPosix = (value) => value.split(path.sep).join('/')
const relApp = (value) => toPosix(path.relative(appRoot, value))
const relWorkspace = (value) => toPosix(path.relative(workspaceRoot, value))

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.vite'].includes(entry.name)) return []
      return walk(fullPath)
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : []
  })
}

function resolveLocalImport(fromFile, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/') && !specifier.startsWith('@content/')) return null

  const base = specifier.startsWith('@/')
    ? path.join(srcRoot, specifier.slice(2))
    : specifier.startsWith('@content/')
      ? path.join(workspaceRoot, 'content', specifier.slice('@content/'.length))
      : path.resolve(path.dirname(fromFile), specifier)

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null
}

function localImports(file) {
  const source = fs.readFileSync(file, 'utf8')
  const specs = new Set()
  for (const match of source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
    specs.add(match[1])
  }
  for (const match of source.matchAll(/import\(['"]([^'"]+)['"]\)/g)) {
    specs.add(match[1])
  }
  return [...specs]
    .map((specifier) => resolveLocalImport(file, specifier))
    .filter(Boolean)
    .map(relApp)
    .sort()
}

function parseAppRoutes() {
  const appFile = path.join(srcRoot, 'App.tsx')
  const source = fs.readFileSync(appFile, 'utf8')
  const componentFiles = new Map()

  for (const match of source.matchAll(/import\s+(\w+)\s+from\s+['"](.+?)['"]/g)) {
    const resolved = resolveLocalImport(appFile, match[2])
    if (resolved) componentFiles.set(match[1], relApp(resolved))
  }
  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['"](.+?)['"]\)\)/g)) {
    const resolved = resolveLocalImport(appFile, match[2])
    if (resolved) componentFiles.set(match[1], relApp(resolved))
  }

  const routes = {
    '/': componentFiles.get('Landing'),
    '/first-flight': componentFiles.get('FirstFlight'),
    '/app': componentFiles.get('Explore'),
  }

  for (const match of source.matchAll(/<Route\s+path=["']([^"']+)["']\s+element=\{routeElement\((\w+)\)\}/g)) {
    const routePath = match[1]
    const component = match[2]
    const file = componentFiles.get(component)
    if (!file) continue
    const fullPath = routePath.startsWith('/') ? routePath : `/app/${routePath}`
    routes[fullPath] = file
  }

  return routes
}

function parseHierarchy() {
  const file = path.join(srcRoot, 'data/hierarchy.ts')
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  let subjectId = null
  const branches = []

  for (const line of lines) {
    const subjectMatch = line.match(/^  ([a-z]+): \{$/)
    if (subjectMatch) subjectId = subjectMatch[1]

    const branchMatch = line.match(/\{\s*id:\s*'([^']+)'.*?name:\s*'([^']+)'.*?status:\s*'([^']+)'.*?componentCount:\s*(\d+).*?route:\s*'([^']+)'.*?gradeMin:\s*(\d+).*?gradeMax:\s*(\d+)/)
    if (subjectId && branchMatch) {
      branches.push({
        subject: subjectId,
        id: branchMatch[1],
        name: branchMatch[2],
        status: branchMatch[3],
        componentCount: Number(branchMatch[4]),
        route: branchMatch[5],
        gradeMin: Number(branchMatch[6]),
        gradeMax: Number(branchMatch[7]),
      })
    }
  }

  return branches
}

function parseBranchDataFiles() {
  const file = path.join(srcRoot, 'data/branchModules.ts')
  const source = fs.readFileSync(file, 'utf8')
  const imports = new Map()

  for (const match of source.matchAll(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"](.+?)['"]/g)) {
    const resolved = resolveLocalImport(file, match[2])
    if (!resolved) continue
    for (const rawName of match[1].split(',')) {
      const name = rawName.trim().split(/\s+as\s+/).pop()?.trim()
      if (name) imports.set(name, relApp(resolved))
    }
  }

  const map = {}
  const body = source.slice(source.indexOf('export const BRANCH_COMPONENTS'))
  for (const match of body.matchAll(/(?:'([^']+)'|([a-zA-Z_][\w]*))\s*(?::\s*([a-zA-Z_][\w]*))?,/g)) {
    const key = match[1] ?? match[2]
    const value = match[3] ?? match[2]
    if (key && value && imports.has(value)) map[key] = imports.get(value)
  }
  return map
}

function routeFileForBranch(routeToFile, route) {
  if (route?.startsWith('/app/labs/branch/')) return routeToFile['/app/labs/branch/:branchId']
  return routeToFile[route]
}

function relevantTests(files, branch, routeFile, dataFile) {
  const testFiles = files.filter((file) => /\.test\.(ts|tsx)$/.test(file))
  const needles = [branch.id, branch.name, routeFile, dataFile]
    .filter(Boolean)
    .flatMap((value) => [value, path.basename(value)])
  return testFiles
    .filter((file) => {
      const source = fs.readFileSync(path.join(appRoot, file), 'utf8')
      return needles.some((needle) => source.includes(needle))
    })
    .slice(0, 12)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort()
}

function contextPack(branch, routeToFile, dataFiles, graph, files) {
  const routeFile = branch.id === 'human-anatomy' ? 'src/routes/Explore.tsx' : routeFileForBranch(routeToFile, branch.route)
  const dataFile = branch.id === 'human-anatomy' ? 'src/data/organs.ts' : dataFiles[branch.id]
  const directRouteImports = routeFile ? graph.nodes[routeFile]?.imports ?? [] : []
  const dataImports = dataFile ? graph.nodes[dataFile]?.imports ?? [] : []
  const tests = relevantTests(files, branch, routeFile, dataFile)
  const commonFiles = [
    'src/data/hierarchy.ts',
    'src/data/branchModules.ts',
    'src/data/modelRegistry.ts',
    'src/components/explorer/CanvasControls.tsx',
    'src/components/explorer/DetailPanel.tsx',
  ]
  const filesToRead = unique([routeFile, dataFile, ...directRouteImports, ...dataImports, ...commonFiles, ...tests])
    .filter((file) => file.startsWith('src/'))
    .slice(0, 28)

  return {
    subject: branch.subject,
    branchId: branch.id,
    branchName: branch.name,
    route: branch.route,
    gradeBand: `${branch.gradeMin}-${branch.gradeMax}`,
    componentCount: branch.componentCount,
    routeFile,
    dataFile,
    filesToRead,
    tests,
    validationCommands: [
      tests.length ? `npm test -- ${tests.join(' ')}` : 'npm test',
      'npm run codegen:check',
      'npm run assets:check',
      'npm run build',
    ],
  }
}

function buildMarkdown(graph, packs) {
  const lines = [
    '# Quantaora Agent Context Packs',
    '',
    'Generated by `npm run context:graph`. Do not edit by hand.',
    '',
    'Use this file to keep agent prompts small: pick one branch, pass only its context pack, and ask the agent to read those files before editing.',
    '',
    '## Commands',
    '',
    '- Refresh graph: `npm run context:graph`',
    '- Print one branch pack: `node scripts/context/build-code-graph.mjs --branch <branch-id>`',
    '- Usual branch QA: focused tests first, then `npm run codegen:check`, `npm run assets:check`, and `npm run build`.',
    '',
    '## Graph Summary',
    '',
    `- Source files scanned: ${Object.keys(graph.nodes).length}`,
    `- Local dependency edges: ${graph.edges.length}`,
    `- Branch packs: ${packs.length}`,
    '',
    '## Branch Packs',
    '',
  ]

  for (const pack of packs) {
    lines.push(`### ${pack.subject} / ${pack.branchName}`)
    lines.push('')
    lines.push(`- Branch id: \`${pack.branchId}\``)
    lines.push(`- Route: \`${pack.route}\``)
    lines.push(`- Components: ${pack.componentCount}`)
    lines.push(`- Primary route file: \`${pack.routeFile ?? 'unknown'}\``)
    lines.push(`- Primary data file: \`${pack.dataFile ?? 'unknown'}\``)
    lines.push(`- Context budget: ${pack.filesToRead.length} files`)
    lines.push(`- Print pack: \`node scripts/context/build-code-graph.mjs --branch ${pack.branchId}\``)
    if (pack.tests.length) lines.push(`- Focused tests: \`${pack.tests.join(' ')}\``)
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

const files = walk(srcRoot).map(relApp).sort()
const graph = {
  generatedAt: new Date().toISOString(),
  appRoot: relWorkspace(appRoot),
  nodes: {},
  edges: [],
}

for (const file of files) {
  const abs = path.join(appRoot, file)
  const imports = localImports(abs)
  graph.nodes[file] = {
    kind: file.includes('/routes/') ? 'route'
      : file.includes('/components/') ? 'component'
        : file.includes('/data/') ? 'data'
          : file.includes('/lib/') ? 'lib'
            : 'source',
    imports,
  }
  for (const target of imports) graph.edges.push({ from: file, to: target })
}

const routeToFile = parseAppRoutes()
const branches = parseHierarchy()
const dataFiles = parseBranchDataFiles()
const packs = branches.map((branch) => contextPack(branch, routeToFile, dataFiles, graph, files))

graph.routes = routeToFile
graph.branches = packs

fs.mkdirSync(docsRoot, { recursive: true })
fs.writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`)
fs.writeFileSync(packsPath, buildMarkdown(graph, packs))

const branchArgIndex = process.argv.indexOf('--branch')
if (branchArgIndex !== -1) {
  const branchId = process.argv[branchArgIndex + 1]
  const pack = packs.find((candidate) => candidate.branchId === branchId)
  if (!pack) {
    console.error(`Unknown branch: ${branchId}`)
    process.exitCode = 1
  } else {
    console.log(JSON.stringify(pack, null, 2))
  }
} else {
  console.log(`Wrote ${relWorkspace(graphPath)} and ${relWorkspace(packsPath)}.`)
  console.log(`Branches: ${packs.length}; files: ${files.length}; edges: ${graph.edges.length}.`)
}
