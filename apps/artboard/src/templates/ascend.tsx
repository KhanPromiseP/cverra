import type {
  Award,
  Certification,
  CustomSection,
  CustomSectionGroup,
  Interest,
  Language,
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
import React, { Fragment } from "react";

import { BrandIcon } from "../components/brand-icon";
import { Picture } from "../components/picture";
import { useArtboardStore } from "../store/artboard";
import type { TemplateProps } from "../types/template";

const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);
  const profiles = useArtboardStore((state) => state.resume.sections.profiles);

  return (
    <div className="flex items-start gap-4 pb-4 border-b border-primary/20">
      {/* Picture - Smaller */}
      <div className="shrink-0">
        <Picture size={80} className="rounded-full border-2 border-primary/30" />
      </div>

      {/* Main Header Content - Compact */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{basics.name}</h1>
            <p className="text-sm text-primary font-medium truncate">{basics.headline}</p>
          </div>
          
          {/* Contact Info - Full Visibility with Labels */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {basics.phone && (
              <a href={`tel:${basics.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary">
                <i className="ph ph-bold ph-phone text-sm" />
                <span>{basics.phone}</span>
              </a>
            )}
            {basics.email && (
              <a href={`mailto:${basics.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary">
                <i className="ph ph-bold ph-at text-sm" />
                <span>{basics.email}</span>
              </a>
            )}
            {basics.location && (
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <i className="ph ph-bold ph-map-pin text-sm" />
                <span>{basics.location}</span>
              </span>
            )}
            {isUrl(basics.url.href) && (
              <Link url={basics.url} className="text-xs text-gray-600 hover:text-primary" />
            )}
          </div>
        </div>

        {/* Custom Fields */}
        {basics.customFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {basics.customFields.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <i className={cn(`ph ph-bold ph-${item.icon}`, "text-sm")} />
                {isUrl(item.value) ? (
                  <a href={item.value} target="_blank" rel="noreferrer noopener nofollow" className="hover:text-primary">
                    {item.name || item.value}
                  </a>
                ) : (
                  <span>{[item.name, item.value].filter(Boolean).join(": ")}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Profiles - Full Visibility with Usernames */}
        {profiles.visible && profiles.items.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-gray-100">
            {profiles.items
              .filter((item) => item.visible)
              .map((item) => (
                <a
                  key={item.id}
                  href={item.url.href}
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary"
                >
                  <BrandIcon slug={item.icon} />
                  <span>{item.username}</span>
                </a>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Summary = () => {
  const section = useArtboardStore((state) => state.resume.sections.summary);

  if (!section.visible || isEmptyString(section.content)) return null;

  return (
    <section id={section.id} className="mb-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
        {section.name}
      </h4>
      <div
        dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
        className="wysiwyg text-xs text-gray-700 leading-relaxed"
      />
    </section>
  );
};

type RatingProps = { level: number };

const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn(
          "h-1.5 w-3 rounded-xs",
          level > index ? "bg-primary" : "bg-gray-200"
        )}
      />
    ))}
  </div>
);

type LinkProps = {
  url: URL;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
  iconOnly?: boolean;
};

const Link = ({ url, icon, label, className }: LinkProps) => {
  if (!isUrl(url.href)) return null;

  return (
    <a
      href={url.href}
      target="_blank"
      rel="noreferrer noopener nofollow"
      className={cn("inline-flex items-center gap-1.5 hover:text-primary", className)}
    >
      {icon ?? <i className="ph ph-bold ph-link text-sm" />}
      <span>{label ?? (url.label || url.href)}</span>
    </a>
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
    <Link url={url} label={name} className={className} />
  ) : (
    <span className={cn("font-medium text-gray-900", className)}>{name}</span>
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
  compact?: boolean;
};

const Section = <T,>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
  compact = false,
}: SectionProps<T>) => {
  if (!section || !section.items || !Array.isArray(section.items)) return null;
  if (!section.visible || section.items.length === 0) return null;

  return (
    <section id={section.id} className="mb-4 last:mb-0">
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 border-b border-gray-200 pb-0.5">
        {section.name}
      </h4>

      <div
        className={cn(
          "grid",
          compact ? "gap-2" : "gap-3",
          section.columns > 1 && `grid-cols-${section.columns}`
        )}
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
              <div key={item.id} className={cn("space-y-1 text-xs", className)}>
                <div>{children?.(item as T)}</div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
                    className="wysiwyg text-xs text-gray-600"
                  />
                )}

                {level !== undefined && level > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Rating level={level} />
                  </div>
                )}

                {keywords !== undefined && keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {url !== undefined && section.separateLinks && (
                  <Link url={url} className="text-xs text-primary/70" />
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
};

// ============ COMPACT SECTION COMPONENTS ============

const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);
  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary" compact>
      {(item) => (
        <div className="space-y-0.5">
          {/* Row 1: Company | Date */}
          <div className="flex items-start justify-between gap-2">
            <LinkedEntity
              name={item.company}
              url={item.url}
              separateLinks={section.separateLinks}
              className="text-xs font-bold text-gray-900"
            />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium text-primary whitespace-nowrap">
                {item.date}
              </span>
              {/* Location - Directly under date, aligned right */}
              {item.location && (
                <span className="text-[9px] text-gray-500 whitespace-nowrap mt-0.5">
                  <i className="mr-2 ph ph-map-pin text-[10px]" />
                  {item.location}
                </span>
              )}
            </div>
          </div>
          
          {/* Row 2: Position (full width) */}
          <div className="text-[11px] text-gray-700 font-medium">
            {item.position}
          </div>
        </div>
      )}
    </Section>
  );
};

const Education = () => {
  const section = useArtboardStore((state) => state.resume.sections.education);
  return (
    <Section<Education> section={section} urlKey="url" summaryKey="summary" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <LinkedEntity
              name={item.institution}
              url={item.url}
              separateLinks={section.separateLinks}
              className="text-xs font-bold text-gray-900"
            />
            <span className="text-[10px] font-medium text-primary whitespace-nowrap">
              {item.date}
            </span>
          </div>
          <div className="text-[11px] text-gray-700">{item.area}</div>
          {(item.studyType || item.score) && (
            <div className="flex flex-wrap gap-1 text-[10px] text-gray-600">
              {item.studyType && <span>{item.studyType}</span>}
              {item.score && <span>• {item.score}</span>}
            </div>
          )}
        </div>
      )}
    </Section>
  );
};

const Skills = () => {
  const section = useArtboardStore((state) => state.resume.sections.skills);
  return (
    <Section<Skill> section={section} levelKey="level" keywordsKey="keywords" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-gray-900">{item.name}</div>
          {item.description && (
            <div className="text-[10px] text-gray-600 italic">{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Awards = () => {
  const section = useArtboardStore((state) => state.resume.sections.awards);
  return (
    <Section<Award> section={section} urlKey="url" summaryKey="summary" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-gray-900">{item.title}</span>
            <span className="text-[10px] font-medium text-primary">{item.date}</span>
          </div>
          <LinkedEntity
            name={item.awarder}
            url={item.url}
            separateLinks={section.separateLinks}
            className="text-[10px] text-gray-600"
          />
        </div>
      )}
    </Section>
  );
};

const Certifications = () => {
  const section = useArtboardStore((state) => state.resume.sections.certifications);
  return (
    <Section<Certification> section={section} urlKey="url" summaryKey="summary" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-gray-900">{item.name}</span>
            <span className="text-[10px] font-medium text-primary">{item.date}</span>
          </div>
          <LinkedEntity
            name={item.issuer}
            url={item.url}
            separateLinks={section.separateLinks}
            className="text-[10px] text-gray-600"
          />
        </div>
      )}
    </Section>
  );
};

const Projects = () => {
  const section = useArtboardStore((state) => state.resume.sections.projects);
  return (
    <Section<Project> section={section} urlKey="url" summaryKey="summary" keywordsKey="keywords" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="text-xs font-bold text-gray-900"
            />
            <span className="text-[10px] font-medium text-primary">{item.date}</span>
          </div>
          {item.description && (
            <div className="text-[10px] text-gray-600">{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Volunteer = () => {
  const section = useArtboardStore((state) => state.resume.sections.volunteer);
  return (
    <Section<Volunteer> section={section} urlKey="url" summaryKey="summary" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <LinkedEntity
              name={item.organization}
              url={item.url}
              separateLinks={section.separateLinks}
              className="text-xs font-bold text-gray-900"
            />
            <span className="text-[10px] font-medium text-primary">{item.date}</span>
          </div>
          <div className="text-[11px] text-gray-700 font-medium">{item.position}</div>
          {item.location && (
            <div className="text-[10px] text-gray-500">{item.location}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Publications = () => {
  const section = useArtboardStore((state) => state.resume.sections.publications);
  return (
    <Section<Publication> section={section} urlKey="url" summaryKey="summary" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="text-xs font-bold text-gray-900"
            />
            <span className="text-[10px] font-medium text-primary">{item.date}</span>
          </div>
          <div className="text-[10px] text-gray-600">{item.publisher}</div>
        </div>
      )}
    </Section>
  );
};

const Languages = () => {
  const section = useArtboardStore((state) => state.resume.sections.languages);
  return (
    <Section<Language> section={section} levelKey="level" compact>
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">{item.name}</span>
            {item.level > 0 && <Rating level={item.level} />}
          </div>
          {item.description && (
            <div className="text-[10px] text-gray-600">{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Interests = () => {
  const section = useArtboardStore((state) => state.resume.sections.interests);
  return (
    <Section<Interest> section={section} keywordsKey="keywords" compact>
      {(item) => (
        <span className="inline-block text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
          {item.name}
        </span>
      )}
    </Section>
  );
};

const References = () => {
  const section = useArtboardStore((state) => state.resume.sections.references);
  return (
    <Section<Reference> section={section} urlKey="url" summaryKey="summary" compact>
      {(item) => (
        <div className="space-y-0.5">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className="text-xs font-bold text-gray-900"
          />
          {item.description && (
            <div className="text-[10px] text-gray-600 italic">{item.description}</div>
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
      compact
    >
      {(item) => (
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="text-xs font-bold text-gray-900"
            />
            {item.date && (
              <span className="text-[10px] font-medium text-primary">{item.date}</span>
            )}
          </div>
          {item.description && (
            <div className="text-[10px] text-gray-600">{item.description}</div>
          )}
          {item.location && (
            <div className="text-[10px] text-gray-500">{item.location}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case "summary": return <Summary />;
    case "experience": return <Experience />;
    case "education": return <Education />;
    case "awards": return <Awards />;
    case "certifications": return <Certifications />;
    case "skills": return <Skills />;
    case "interests": return <Interests />;
    case "publications": return <Publications />;
    case "volunteer": return <Volunteer />;
    case "languages": return <Languages />;
    case "projects": return <Projects />;
    case "references": return <References />;
    default: {
      if (section.startsWith("custom.")) return <Custom id={section.split(".")[1]} />;
      return null;
    }
  }
};

export const Ascend = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;
  const allSections = [...main, ...sidebar];

  return (
    <div className="bg-white p-5 shadow-sm">
      {isFirstPage && <Header />}
      
      <div className="space-y-3">
        {allSections.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
      </div>
    </div>
  );
};