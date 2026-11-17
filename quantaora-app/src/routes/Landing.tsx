import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import StudioSection from '@/components/landing/StudioSection'
import TutorSection from '@/components/landing/TutorSection'
import SubjectsSection from '@/components/landing/SubjectsSection'
import CurriculumSection from '@/components/landing/CurriculumSection'
import LocalProgressSection from '@/components/landing/LocalProgressSection'
import ParentSection from '@/components/landing/ParentSection'
import FinalCta from '@/components/landing/FinalCta'
import Footer from '@/components/landing/Footer'

export default function Landing() {
  return (
    <div className="bg-[color:var(--color-background)]">
      <Nav />
      <Hero />
      <StudioSection />
      <TutorSection />
      <SubjectsSection />
      <CurriculumSection />
      <LocalProgressSection />
      <ParentSection />
      <FinalCta />
      <Footer />
    </div>
  )
}
