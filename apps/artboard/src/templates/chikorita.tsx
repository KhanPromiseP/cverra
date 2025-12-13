import type {
  Award,
  Certification,
  CustomSection,
  CustomSectionGroup,
  Interest,
  Language,
  Profile,
  Project,
  Publication,
  Reference,
  SectionKey,
  SectionWithItem,
  Skill,
  URL,
} from "@reactive-resume/schema";
import { Education, Experience, Volunteer } from "@reactive-resume/schema";
import { cn, isEmptyString, isUrl, sanitize } from "@reactive-resume/utils";
import get from "lodash.get";
import { Fragment } from "react";

import { BrandIcon } from "../components/brand-icon";
import { Picture } from "../components/picture";
import { useArtboardStore } from "../store/artboard";
import type { TemplateProps } from "../types/template";

const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);

  return (
    <div className="flex items-start justify-between mb-6">
  <div className="flex items-start gap-4">

    {/* DECORATED PROFILE PICTURE */}
    <div className="relative">

      {/* Soft gradient halo */}
      <div className="absolute inset-0 -z-10 h-36 w-36 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-xl"></div>

      {/* Outer glowing ring */}
      <div className="absolute inset-0 -z-10 h-36 w-36 rounded-full border-4 border-primary/40 blur-sm"></div>

      {/* Rotated diamond frame (modern) */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-40 w-40 rotate-45 rounded-xl border-4 border-primary/20"></div>
      </div>

      {/* Small accent squares */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-3 bg-primary/70 rotate-45 rounded-sm"></div>
      <div className="absolute bottom-0 -right-2 size-3 bg-primary/60 rounded-[2px]"></div>

      {/* Actual photo frame */}
      <div className="border-4 border-primary bg-white rounded-full flex items-center justify-center shadow-md p-1">
        <Picture size={120} className="rounded-full" />
      </div>
    </div>

    {/* NAME + CONTACT DETAILS */}
    <div className="space-y-1">
      <div className="text-2xl font-bold text-gray-900">{basics.name}</div>
      <div className="text-base text-primary font-semibold">{basics.headline}</div>
      
      <div className="flex flex-wrap gap-2 text-xs text-gray-700 mt-2">
        {basics.phone && (
          <div className="flex items-center gap-x-1 bg-gray-100 px-2 py-1 rounded-md">
            <i className="ph ph-bold ph-phone text-primary text-xs" />
            <a href={`tel:${basics.phone}`}>{basics.phone}</a>
          </div>
        )}

        {basics.email && (
          <div className="flex items-center gap-x-1 bg-gray-100 px-2 py-1 rounded-md">
            <i className="ph ph-bold ph-at text-primary text-xs" />
            <a href={`mailto:${basics.email}`}>{basics.email}</a>
          </div>
        )}

        {basics.location && (
          <div className="flex items-center gap-x-1 bg-gray-100 px-2 py-1 rounded-md">
            <i className="ph ph-bold ph-map-pin text-primary text-xs" />
            <div>{basics.location}</div>
          </div>
        )}

        <Link url={basics.url} />

        {basics.customFields.map((item) => (
          <div key={item.id} className="flex items-center gap-x-1 bg-gray-100 px-2 py-1 rounded-md">
            <i className={cn(`ph ph-bold ph-${item.icon}`, "text-primary text-xs")} />
            {isUrl(item.value) ? (
              <a href={item.value} target="_blank" rel="noreferrer noopener nofollow">
                {item.name || item.value}
              </a>
            ) : (
              <span>{[item.name, item.value].filter(Boolean).join(": ")}</span>
            )}
          </div>
        ))}
      </div>
    </div>

  </div>
</div>

  );
};

const Summary = () => {
  const section = useArtboardStore((state) => state.resume.sections.summary);

  if (!section.visible || isEmptyString(section.content)) return null;

  return (
    <section id={section.id} className="mb-4">
      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
        {section.name}
      </h4>

      <div
        dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
        style={{ columns: section.columns }}
        className="wysiwyg text-sm text-gray-800 leading-relaxed"
      />
    </section>
  );
};

type RatingProps = { level: number };

const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-x-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn(
          "size-2 rounded-sm border transition-all duration-200",
          level > index 
            ? "bg-primary border-primary" 
            : "bg-gray-200 border-gray-300",
          "group-[.sidebar]:border-background group-[.sidebar]:bg-background"
        )}
      />
    ))}
  </div>
);

type LinkProps = {
  url: URL;
  icon?: React.ReactNode;
  iconOnRight?: boolean;
  label?: string;
  className?: string;
};

const Link = ({ url, icon, iconOnRight, label, className }: LinkProps) => {
  if (!isUrl(url.href)) return null;

  return (
    <div className="flex items-center gap-x-1">
      {!iconOnRight &&
        (icon ?? <i className="ph ph-bold ph-link text-primary text-xs group-[.sidebar]:text-white" />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn("inline-block text-xs hover:text-primary transition-colors", className)}
      >
        {label ?? (url.label || url.href)}
      </a>
      {iconOnRight &&
        (icon ?? <i className="ph ph-bold ph-link text-primary text-xs group-[.sidebar]:text-white" />)}
    </div>
  );
};

type LinkedEntityProps = {
  name: string;
  url: URL;
  separateLinks: boolean;
  className?: string;
};

const LinkedEntity = ({ name, url, separateLinks, className }: LinkedEntityProps) => {
  return !separateLinks && isUrl(url.href) ? (
    <Link
      url={url}
      label={name}
      icon={<i className="ph ph-bold ph-globe text-primary text-xs" />}
      iconOnRight={true}
      className={className}
    />
  ) : (
    <div className={cn("font-bold text-gray-900", className)}>{name}</div>
  );
};

type SectionProps<T> = {
  section: SectionWithItem<T> | CustomSectionGroup;
  children?: (item: T) => React.ReactNode;
  className?: string;
  urlKey?: keyof T;
  levelKey?: keyof T;
  summaryKey?: keyof T;
  keywordsKey?: keyof T;
};

const Section = <T,>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: SectionProps<T>) => {
  if (!section.visible || section.items.length === 0) return null;

  return (
    <section id={section.id} className="grid mb-4">
      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
        {section.name}
      </h4>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
      >
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            const url = (urlKey && get(item, urlKey)) as URL | undefined;
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
            const summary = (summaryKey && get(item, summaryKey, "")) as string | undefined;
            const keywords = (keywordsKey && get(item, keywordsKey, [])) as string[] | undefined;

            return (
              <div key={item.id} className={cn("space-y-2", className)}>
                <div>
                  {children?.(item as T)}
                  {url !== undefined && section.separateLinks && <Link url={url} />}
                </div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
                    className="wysiwyg group-[.sidebar]:prose-invert text-sm text-gray-800 leading-relaxed"
                  />
                )}

                {level !== undefined && level > 0 && (
                  <div className="flex items-center gap-x-2">
                    <span className="text-xs text-gray-600">Level:</span>
                    <Rating level={level} />
                  </div>
                )}

                {keywords !== undefined && keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded border border-primary/20 font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
};

const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <LinkedEntity
                name={item.company}
                url={item.url}
                separateLinks={section.separateLinks}
                className="text-base"
              />
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <div className="text-primary font-semibold text-sm">{item.position}</div>
            {item.summary && (
              <ul className="text-xs text-gray-700 space-y-0.5 mt-1">
                {item.summary.split('\n').map((point, index) => (
                  <li key={index} className="flex items-start gap-x-1">
                    <span className="text-primary mt-1 text-xs">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
            {item.location && (
              <div className="text-xs text-gray-600 mt-1">{item.location}</div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
};

const Education = () => {
  const section = useArtboardStore((state) => state.resume.sections.education);

  return (
    <Section<Education> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <LinkedEntity
                name={item.institution}
                url={item.url}
                separateLinks={section.separateLinks}
                className="text-base"
              />
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <div className="text-primary font-semibold text-sm">{item.area}</div>
            {item.score && (
              <div className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded inline-block">
                GPA: {item.score}
              </div>
            )}
            {item.studyType && (
              <div className="text-xs text-gray-600">{item.studyType}</div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
};

const Profiles = () => {
  const section = useArtboardStore((state) => state.resume.sections.profiles);

  return (
    <Section<Profile>
      section={section}
      className="flex gap-4 flex-nowrap"   // ← THIS forces side-by-side
    >
      {(item) => (
        <div className="shrink-0">        {/* prevents element from shrinking */}
          {isUrl(item.url.href) ? (
            <Link
              url={item.url}
              label={item.username}
              icon={<BrandIcon slug={item.icon} />}
            />
          ) : (
            <div className="font-bold text-gray-900 text-sm">
              {item.username}
            </div>
          )}

          {!item.icon && (
            <div className="text-xs text-gray-600 mt-0.5">
              {item.network}
            </div>
          )}
        </div>
      )}
    </Section>
  );
};


const Awards = () => {
  const section = useArtboardStore((state) => state.resume.sections.awards);

  return (
    <Section<Award> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <div className="text-base font-bold text-gray-900">{item.title}</div>
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <LinkedEntity
              name={item.awarder}
              url={item.url}
              separateLinks={section.separateLinks}
              className="text-primary font-semibold text-sm"
            />
          </div>
        </div>
      )}
    </Section>
  );
};

const Certifications = () => {
  const section = useArtboardStore((state) => state.resume.sections.certifications);

  return (
    <Section<Certification> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <div className="text-base font-bold text-gray-900">{item.name}</div>
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <LinkedEntity name={item.issuer} url={item.url} separateLinks={section.separateLinks} />
          </div>
        </div>
      )}
    </Section>
  );
};

const Skills = () => {
  const section = useArtboardStore((state) => state.resume.sections.skills);

  return (
    <Section<Skill> section={section} levelKey="level" keywordsKey="keywords">
      {(item) => (
        <div className="space-y-1">
          <div className="font-bold text-gray-900 text-sm">{item.name}</div>
          {item.description && (
            <div className="text-xs text-gray-700">{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Interests = () => {
  const section = useArtboardStore((state) => state.resume.sections.interests);

  return (
    <Section<Interest> section={section} keywordsKey="keywords" className="space-y-1">
      {(item) => <div className="font-bold text-gray-900 text-sm">{item.name}</div>}
    </Section>
  );
};

const Publications = () => {
  const section = useArtboardStore((state) => state.resume.sections.publications);

  return (
    <Section<Publication> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <LinkedEntity
                name={item.name}
                url={item.url}
                separateLinks={section.separateLinks}
                className="text-base"
              />
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <div className="text-primary font-semibold text-sm">{item.publisher}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

const Volunteer = () => {
  const section = useArtboardStore((state) => state.resume.sections.volunteer);

  return (
    <Section<Volunteer> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <LinkedEntity
                name={item.organization}
                url={item.url}
                separateLinks={section.separateLinks}
                className="text-base"
              />
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <div className="text-primary font-semibold text-sm">{item.position}</div>
            {item.location && (
              <div className="text-xs text-gray-600">{item.location}</div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
};

const Languages = () => {
  const section = useArtboardStore((state) => state.resume.sections.languages);

  return (
    <Section<Language> section={section} levelKey="level">
      {(item) => (
        <div className="space-y-1">
          <div className="font-bold text-gray-900 text-sm">{item.name}</div>
          {item.description && (
            <div className="text-xs text-gray-700">{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Projects = () => {
  const section = useArtboardStore((state) => state.resume.sections.projects);

  return (
    <Section<Project> section={section} urlKey="url" summaryKey="summary" keywordsKey="keywords">
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <LinkedEntity
                name={item.name}
                url={item.url}
                separateLinks={section.separateLinks}
                className="text-base"
              />
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <div className="text-primary font-semibold text-sm">{item.description}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

const References = () => {
  const section = useArtboardStore((state) => state.resume.sections.references);

  return (
    <Section<Reference> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="space-y-1">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className="text-base"
          />
          {item.description && (
            <div className="text-xs text-gray-700">{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Custom = ({ id }: { id: string }) => {
  const section = useArtboardStore((state) => state.resume.sections.custom[id]);

  return (
    <Section<CustomSection>
      section={section}
      urlKey="url"
      summaryKey="summary"
      keywordsKey="keywords"
    >
      {(item) => (
        <div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
          <div className="text-left space-y-1 flex-1">
            <div className="flex items-start justify-between">
              <LinkedEntity
                name={item.name}
                url={item.url}
                separateLinks={section.separateLinks}
                className="text-base"
              />
              <div className="shrink-0 text-right group-[.sidebar]:text-left group-[.sidebar]:mt-1">
                <div className="font-bold text-gray-900 bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {item.date}
                </div>
              </div>
            </div>
            <div className="text-primary font-semibold text-sm">{item.description}</div>
            {item.location && (
              <div className="text-xs text-gray-600">{item.location}</div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
};

const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case "profiles": {
      return <Profiles />;
    }
    case "summary": {
      return <Summary />;
    }
    case "experience": {
      return <Experience />;
    }
    case "education": {
      return <Education />;
    }
    case "awards": {
      return <Awards />;
    }
    case "certifications": {
      return <Certifications />;
    }
    case "skills": {
      return <Skills />;
    }
    case "interests": {
      return <Interests />;
    }
    case "publications": {
      return <Publications />;
    }
    case "volunteer": {
      return <Volunteer />;
    }
    case "languages": {
      return <Languages />;
    }
    case "projects": {
      return <Projects />;
    }
    case "references": {
      return <References />;
    }
    default: {
      if (section.startsWith("custom.")) return <Custom id={section.split(".")[1]} />;

      return null;
    }
  }
};

export const Chikorita = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="p-1 min-h-[inherit] border-4 border-primary rounded-xl bg-white shadow-sm overflow-hidden">

      <div className="grid min-h-[inherit] grid-cols-3">
        <div
          className={cn(
            "main p-6 group space-y-4",
            sidebar.length > 0 ? "col-span-2" : "col-span-3",
          )}
        >
          {isFirstPage && <Header />}

          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>

        <div
          className={cn(
            "sidebar p-6 group h-full space-y-4 bg-primary text-white",
            sidebar.length === 0 && "hidden",
          )}
        >
          {sidebar.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};