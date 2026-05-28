import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"

const features = [
  {
    title: "Conversion Signals",
    description:
      "Surface the clearest friction points and intent gaps across your most valuable journeys.",
    className:
      "relative overflow-hidden sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-[color-mix(in_srgb,var(--surface)_86%,transparent)]",
    visual: "hero",
  },
  {
    title: "Priority Queue",
    description:
      "Rank opportunities by likely impact so teams know exactly what to ship first.",
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]",
    visual: "queue",
  },
  {
    title: "AI Guidance",
    description:
      "Turn findings into concise recommendations with clear ownership and implementation direction.",
    className:
      "relative overflow-hidden sm:col-span-2 lg:col-span-1 bg-[color-mix(in_srgb,var(--surface)_66%,transparent)]",
    visual: "guidance",
  },
  {
    title: "Execution Visibility",
    description:
      "Keep product and growth aligned with a shared view of progress, status, and expected lift.",
    className:
      "relative overflow-hidden bg-[color-mix(in_srgb,var(--surface)_68%,transparent)]",
    visual: "progress",
  },
]

function FeaturesSection() {
  return (
    <Section aria-labelledby="features-title">
      <div className="space-y-10 sm:space-y-12">
        <FadeIn>
          <SectionHeader
            eyebrow="Product"
            title="Features built for focused growth execution"
            description="A clean system of analysis and prioritization designed to help teams ship higher-converting experiences."
            id="features-title"
          />
        </FadeIn>

        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={0.05 + index * 0.05}>
              <Card
                className={[
                  "h-full border-[color-mix(in_srgb,var(--border)_90%,transparent)] transition-[transform,box-shadow,border-color] duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_32%,var(--border))] hover:shadow-[var(--shadow-medium)]",
                  feature.className,
                ].join(" ")}
              >
                {feature.visual === "hero" ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_55%)]"
                  />
                ) : null}

                <div className="relative flex h-full flex-col gap-6">
                  <div className="space-y-3">
                    <Heading level={3} size={feature.visual === "hero" ? "section" : "subsection"}>
                      {feature.title}
                    </Heading>
                    <Text variant="muted">{feature.description}</Text>
                  </div>

                  {feature.visual === "hero" ? (
                    <div className="mt-auto space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-3">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Intent Match
                          </Text>
                          <Heading level={4} size="subsection" className="mt-1">
                            +28%
                          </Heading>
                        </div>
                        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-3">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Friction Reduced
                          </Text>
                          <Heading level={4} size="subsection" className="mt-1">
                            -19%
                          </Heading>
                        </div>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Recommendation Confidence
                          </Text>
                          <Text size="sm" className="max-w-none">
                            87%
                          </Text>
                        </div>
                        <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,black)]">
                          <div className="h-full w-[87%] rounded-full bg-[var(--accent)]" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {feature.visual === "queue" ? (
                    <div className="mt-auto space-y-2">
                      {["Homepage friction", "Pricing clarity", "Form completion"].map((item, itemIndex) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] px-3 py-2"
                        >
                          <Text size="sm" variant="muted" className="max-w-none">
                            {item}
                          </Text>
                          <Text size="sm" className="max-w-none">
                            P{itemIndex + 1}
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {feature.visual === "guidance" ? (
                    <div className="mt-auto space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-3">
                      <Text size="sm" className="max-w-none">
                        AI analysis fragment
                      </Text>
                      <div className="space-y-1.5">
                        <div className="h-2 w-[90%] rounded-full bg-[color-mix(in_srgb,var(--muted)_26%,transparent)]" />
                        <div className="h-2 w-[72%] rounded-full bg-[color-mix(in_srgb,var(--muted)_20%,transparent)]" />
                        <div className="h-2 w-[84%] rounded-full bg-[color-mix(in_srgb,var(--muted)_16%,transparent)]" />
                      </div>
                    </div>
                  ) : null}

                  {feature.visual === "progress" ? (
                    <div className="mt-auto space-y-3">
                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <Text size="sm" variant="muted" className="max-w-none">
                            Rollout Progress
                          </Text>
                          <Text size="sm" className="max-w-none">
                            64%
                          </Text>
                        </div>
                        <div className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--surface)_72%,black)]">
                          <div className="h-full w-[64%] rounded-full bg-[color-mix(in_srgb,var(--accent)_78%,white)]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-2.5 text-center">
                          <Text size="sm" className="max-w-none">
                            12
                          </Text>
                        </div>
                        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-2.5 text-center">
                          <Text size="sm" className="max-w-none">
                            4 In Review
                          </Text>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { FeaturesSection }
