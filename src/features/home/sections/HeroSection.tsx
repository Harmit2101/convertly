import { Button } from "@/components/ui/button"
import { Section } from "@/components/layout/Section"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { FadeIn } from "@/components/motion/FadeIn"

function HeroSection() {
  return (
    <Section
      aria-labelledby="home-hero-title"
      className="relative flex min-h-[80vh] items-center overflow-hidden"
      containerClassName="[--container-max:90rem]"
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-[-14rem] -z-10 h-[20rem] bg-[var(--gradient-primary)] opacity-12 blur-3xl" />

        <div className="grid items-center gap-12 py-24 sm:py-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="flex max-w-2xl flex-col gap-7 sm:gap-8">
            <FadeIn>
              <Text
                size="sm"
                className="inline-flex w-fit max-w-none items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_26%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_90%,transparent),color-mix(in_srgb,var(--surface)_80%,transparent))] px-3.5 py-1.5 text-[0.7rem] font-medium tracking-[0.18em] uppercase text-foreground/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
              >
                AI Growth Intelligence
              </Text>
            </FadeIn>

            <FadeIn delay={0.06}>
              <Heading
                id="home-hero-title"
                level={1}
                size="hero"
                className="max-w-[11.5ch] text-balance leading-[1.02]"
              >
                Turn More Visitors Into Revenue.
              </Heading>
            </FadeIn>

            <FadeIn delay={0.12}>
              <Text
                variant="muted"
                size="lg"
                balanced
                className="max-w-[44ch] text-foreground/68"
              >
                Convertly analyzes your website experience and highlights the
                highest-impact opportunities to improve conversion with clarity
                and speed.
              </Text>
            </FadeIn>

            <FadeIn delay={0.18}>
              <div className="flex flex-col items-start gap-3 pt-3 sm:flex-row">
                <Button className="h-11 w-full px-6 sm:w-auto">
                  Start Free Audit
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full border-[var(--border)] px-6 sm:w-auto"
                >
                  See How It Works
                </Button>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.08} className="lg:pl-4">
            <div className="relative mx-auto w-full max-w-xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 -top-4 z-0 hidden h-full rounded-[calc(var(--radius-xl)+2px)] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] sm:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 bottom-5 z-0 hidden h-24 w-24 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_64%,transparent)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] lg:block"
              />

              <Card className="relative z-10 overflow-hidden p-4.5 sm:p-5.5">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_58%)]"
                />
                <div className="relative space-y-4.5 sm:space-y-5">
                  <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                    <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_95%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-3.5 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                      <Text size="sm" variant="muted" className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54">
                        Opportunity Lift
                      </Text>
                      <Heading level={3} size="subsection" className="mt-2 text-[1.75rem] leading-none text-foreground">
                        +31%
                      </Heading>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_95%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-3.5 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                      <Text size="sm" variant="muted" className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54">
                        Confidence Score
                      </Text>
                      <Heading level={3} size="subsection" className="mt-2 text-[1.75rem] leading-none text-foreground">
                        89
                      </Heading>
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_96%,transparent)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="mb-3.5 flex items-center justify-between">
                      <Text size="sm" variant="muted" className="max-w-none text-[0.72rem] tracking-[0.08em] uppercase text-foreground/54">
                        Workflow Coverage
                      </Text>
                      <Text size="sm" className="max-w-none text-sm font-medium text-foreground/90">
                        68%
                      </Text>
                    </div>
                    <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_76%,black)]">
                      <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_92%,white),var(--accent))] shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_30%,transparent)]" />
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-3">
                      <Text size="sm" className="max-w-none text-[0.78rem] font-medium tracking-[0.06em] uppercase text-foreground/74">
                        AI Analysis
                      </Text>
                      <div className="mt-2 space-y-1.5">
                        <div className="h-1.5 w-[88%] rounded-full bg-[color-mix(in_srgb,var(--muted)_24%,transparent)]" />
                        <div className="h-1.5 w-[66%] rounded-full bg-[color-mix(in_srgb,var(--muted)_18%,transparent)]" />
                      </div>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-3">
                      <Text size="sm" className="max-w-none text-[0.78rem] font-medium tracking-[0.06em] uppercase text-foreground/74">
                        Next Actions
                      </Text>
                      <div className="mt-2 space-y-2">
                        <div className="h-1.5 w-full rounded-full bg-[color-mix(in_srgb,var(--muted)_22%,transparent)]" />
                        <div className="h-1.5 w-[78%] rounded-full bg-[color-mix(in_srgb,var(--muted)_16%,transparent)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </FadeIn>
        </div>
      </div>
    </Section>
  )
}

export { HeroSection }