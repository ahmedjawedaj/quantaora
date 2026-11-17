import { lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './routes/Landing'
import FirstFlight from './routes/FirstFlight'
import RouteLoadingFallback from '@/components/routing/RouteLoadingFallback'
import RouteErrorBoundary from '@/components/routing/RouteErrorBoundary'

const AppShell = lazy(() => import('./routes/AppShell'))
const Explore = lazy(() => import('./routes/Explore'))
const Subjects = lazy(() => import('./routes/Subjects'))
const Labs = lazy(() => import('./routes/Labs'))
const Notebook = lazy(() => import('./routes/Notebook'))
const Grownups = lazy(() => import('./routes/Grownups'))
const ChemistryLab = lazy(() => import('./routes/ChemistryLab'))
const ChemicalReactionsLab = lazy(() => import('./routes/ChemicalReactionsLab'))
const AtomsLab = lazy(() => import('./routes/AtomsLab'))
const SpaceLab = lazy(() => import('./routes/SpaceLab'))
const MathLab = lazy(() => import('./routes/MathLab'))
const MathManipulativesLab = lazy(() => import('./routes/MathManipulativesLab'))
const NumberSenseLab = lazy(() => import('./routes/NumberSenseLab'))
const PhysicsLab = lazy(() => import('./routes/PhysicsLab'))
const ElectricityLab = lazy(() => import('./routes/ElectricityLab'))
const EnergyLab = lazy(() => import('./routes/EnergyLab'))
const PhysiologyLab = lazy(() => import('./routes/PhysiologyLab'))
const CellLab = lazy(() => import('./routes/CellLab'))
const StarsLab = lazy(() => import('./routes/StarsLab'))
const GalaxyLab = lazy(() => import('./routes/GalaxyLab'))
const MoonsLab = lazy(() => import('./routes/MoonsLab'))
const EarthInSpaceLab = lazy(() => import('./routes/EarthInSpaceLab'))
const GeneticsLab = lazy(() => import('./routes/GeneticsLab'))
const PlantsLab = lazy(() => import('./routes/PlantsLab'))
const MicrobiologyLab = lazy(() => import('./routes/MicrobiologyLab'))
const EcologyLab = lazy(() => import('./routes/EcologyLab'))
const BranchLab = lazy(() => import('./routes/BranchLab'))
const NotFound = lazy(() => import('./routes/NotFound'))

// Wraps each lazily-loaded route in its own error/loading boundary so a chunk failure or
// in-flight load on one route never blanks the rest of the app (nav shell keeps rendering).
function routeElement(RouteComponent: ComponentType) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <RouteComponent />
      </Suspense>
    </RouteErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/first-flight" element={<FirstFlight />} />
        <Route path="/app" element={routeElement(AppShell)}>
          <Route index element={routeElement(Explore)} />
          <Route path="subjects" element={routeElement(Subjects)} />
          <Route path="labs" element={routeElement(Labs)} />
          <Route path="labs/molecules" element={routeElement(ChemistryLab)} />
          <Route path="labs/reactions" element={routeElement(ChemicalReactionsLab)} />
          <Route path="labs/atoms" element={routeElement(AtomsLab)} />
          <Route path="labs/orbit" element={routeElement(SpaceLab)} />
          <Route path="labs/functions" element={routeElement(MathLab)} />
          <Route path="labs/math-manipulatives" element={routeElement(MathManipulativesLab)} />
          <Route path="labs/number-sense" element={routeElement(NumberSenseLab)} />
          <Route path="labs/motion" element={routeElement(PhysicsLab)} />
          <Route path="labs/energy" element={routeElement(EnergyLab)} />
          <Route path="labs/electricity" element={routeElement(ElectricityLab)} />
          <Route path="labs/physiology" element={routeElement(PhysiologyLab)} />
          <Route path="labs/cells" element={routeElement(CellLab)} />
          <Route path="labs/stars" element={routeElement(StarsLab)} />
          <Route path="labs/galaxies" element={routeElement(GalaxyLab)} />
          <Route path="labs/moons" element={routeElement(MoonsLab)} />
          <Route path="labs/earth-in-space" element={routeElement(EarthInSpaceLab)} />
          <Route path="labs/genetics" element={routeElement(GeneticsLab)} />
          <Route path="labs/ecology" element={routeElement(EcologyLab)} />
          <Route path="labs/plants" element={routeElement(PlantsLab)} />
          <Route path="labs/microbiology" element={routeElement(MicrobiologyLab)} />
          <Route path="labs/branch/:branchId" element={routeElement(BranchLab)} />
          <Route path="notebook" element={routeElement(Notebook)} />
          <Route path="grownups" element={routeElement(Grownups)} />
          <Route path="*" element={routeElement(NotFound)} />
        </Route>
        <Route path="*" element={routeElement(NotFound)} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
