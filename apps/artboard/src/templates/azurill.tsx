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
import { cn, isEmptyString, isUrl, linearTransform, sanitize } from "@reactive-resume/utils";
import get from "lodash.get";
import React, { Fragment } from "react";

import { BrandIcon } from "../components/brand-icon";
import { Picture } from "../components/picture";
import { useArtboardStore } from "../store/artboard";
import type { TemplateProps } from "../types/template";

const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);

  return (
    <div className="relative grid grid-cols-3 gap-0 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80">
      {/* Decorative curved shapes */}
      <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>
      <div className="absolute right-1/4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5 blur-xl"></div>

      {/* Profile Picture Section with curved background */}
      <div className="relative z-10 flex items-center justify-center p-1">
        {/* Curved decorative element behind picture */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-48 rounded-full bg-gradient-to-br from-white/20 to-white/5 blur-xl"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-40 rounded-full bg-white/10"></div>
        </div>
        
        {/* Picture with elegant border */}
        <div className="relative rounded-full border-4 border-white p-1 shadow-2xl">
          <Picture size={200} className="rounded-full" />
        </div>
      </div>

      {/* Name and Title Section with curved transition */}
      <div className="relative col-span-2 flex flex-col justify-center space-y-3 bg-white p-10">
              {/* Curved edge decoration */}
            <div className="absolute -left-8 top-0 h-full w-19">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Pentagon */}
          <path 
            d="M50,0 L100,35 L80,100 L20,100 L0,35 Z" 
            fill="white" 
          />
        </svg>
      </div>

        
        <div className="relative z-10">
          <div className="text-5xl font-black uppercase tracking-tight text-gray-900">{basics.name}</div>
          <div className="mt-2 text-xl font-light uppercase tracking-widest text-primary">{basics.headline}</div>
          
          {/* Decorative line */}
          <div className="mt-4 flex items-center gap-2">
          <div className="h-1 w-20 bg-gradient-to-r from-primary via-primary/70 to-transparent rounded-full"></div>
          <div className="h-1 w-8 bg-gradient-to-r from-primary/40 to-transparent rounded-full"></div>
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
    <section id={section.id}>
      {/* Sidebar Style */}
      <div className="absolute -right-32 -top-32 h-64 w-64 rounded-xl bg-white/10 blur-3xl"></div>
      <div className="mb-3 hidden items-center gap-x-3 rounded-xl border-2 border-primary bg-gray-700 px-4 py-2 group-[.sidebar]:flex">
        
        <i className="ph ph-bold ph-user-circle text-2xl text-primary" />
        <h4 className="text-base font-bold uppercase text-white">{section.name}</h4>
      </div>

      {/* Main Style */}
      <div className="mb-3 hidden items-center gap-x-3 rounded-xl border-2 border-primary bg-white px-6 py-2.5 group-[.main]:flex">
        <i className="ph ph-bold ph-user-circle text-2xl text-primary" />
        <h4 className="text-lg font-bold uppercase">{section.name}</h4>
      </div>

      <main className={cn(
        "relative space-y-2",
        "group-[.main]:border-l-4 group-[.main]:border-primary group-[.main]:pl-6",
        "group-[.sidebar]:pl-2"
      )}>
        <div
          dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
          style={{ columns: section.columns }}
          className={cn(
            "wysiwyg text-sm",
            "group-[.main]:text-justify",
            "group-[.sidebar]:text-white"
          )}
        />
      </main>
    </section>
  );
};

type RatingProps = { level: number };

const Rating = ({ level }: RatingProps) => (
  <div className="relative h-2 w-full">
    <div className="absolute inset-0 h-2 rounded-full bg-gray-300 group-[.sidebar]:bg-gray-600" />
    <div
      className="absolute inset-0 h-2 rounded-full bg-primary"
      style={{ width: `${(level / 5) * 100}%` }}
    />
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
    <div className="flex items-center gap-x-1.5">
      {!iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn("inline-block", className)}
      >
        {label ?? (url.label || url.href)}
      </a>
      {iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
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
      icon={<i className="ph ph-bold ph-globe text-primary" />}
      iconOnRight={true}
      className={className}
    />
  ) : (
    <div className={className}>{name}</div>
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
  sidebarIcon?: string;
  mainIcon?: string;
};

const Section = <T,>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
  sidebarIcon = "list",
  mainIcon = "list",
}: SectionProps<T>) => {
  if (!section.visible || section.items.length === 0) return null;

  return (
    <section id={section.id} className="grid">
      {/* Sidebar Header Style */}
      <div className="mb-3 hidden items-center gap-x-3 rounded-xl border-2 border-primary bg-gray-700 px-4 py-2 group-[.sidebar]:flex">
        <i className={cn(`ph ph-bold ph-${sidebarIcon}`, "text-2xl text-primary")} />
        <h4 className="text-base font-bold uppercase text-white">{section.name}</h4>
      </div>

      {/* Main Header Style */}
      <div className="mb-3 hidden items-center gap-x-3 rounded-xl border-2 border-primary bg-white px-6 py-2.5 group-[.main]:flex">
        <i className={cn(`ph ph-bold ph-${mainIcon}`, "text-2xl text-primary")} />
        <h4 className="text-lg font-bold uppercase">{section.name}</h4>
      </div>

      <div
        className="grid gap-x-6 gap-y-4"
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
              <div
                key={item.id}
                className={cn(
                  "relative space-y-2",
                  "group-[.main]:border-l-4 group-[.main]:border-primary group-[.main]:pl-8",
                  "group-[.sidebar]:pl-2",
                  className,
                )}
              >
                {/* Timeline dot for main section */}
               <div className="absolute -left-[9px] top-0 hidden flex flex-col gap-[2px] group-[.main]:block">
                <div className="size-2 bg-primary"></div>
                <div className="size-2 bg-primary/60"></div>
                <div className="size-2 bg-primary/30"></div>
              </div>

                
                {/* Bullet dot for sidebar section */}
               <div className="absolute left-[-6px] top-1.5 hidden size-2 bg-primary shadow-[0_0_4px] shadow-primary/70 group-[.sidebar]:block" />


                <div>{children?.(item as T)}</div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
                    className={cn(
                      "wysiwyg text-sm",
                      "group-[.main]:text-justify",
                      "group-[.sidebar]:text-gray-300"
                    )}
                  />
                )}

                {level !== undefined && level > 0 && <Rating level={level} />}

                {keywords !== undefined && keywords.length > 0 && (
                  <p className={cn(
                    "text-xs",
                    "group-[.sidebar]:text-gray-400"
                  )}>{keywords.join(", ")}</p>
                )}

                {url !== undefined && section.separateLinks && <Link url={url} />}
              </div>
            );
          })}
      </div>
    </section>
  );
};

const Profiles = () => {
  const section = useArtboardStore((state) => {
    const profilesSection = state.resume.sections.profiles;
    // Force 2 columns for profiles
    return {
      ...profilesSection,
      columns: 2
    };
  });

  return (
    <Section<Profile> 
      section={section} 
      mainIcon="users" 
      sidebarIcon="users"
    >
      {(item) => (
        <div className="flex items-center gap-x-3">
          <div className="text-xl text-primary">
            <BrandIcon slug={item.icon} />
          </div>
          {isUrl(item.url.href) ? (
            <a href={item.url.href} className="text-sm hover:text-primary" target="_blank" rel="noreferrer">
              {item.username}
            </a>
          ) : (
            <span className="text-sm">{item.username}</span>
          )}
        </div>
      )}
    </Section>
  );
};

const ContactInfo = () => {
  const basics = useArtboardStore((state) => state.resume.basics);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-x-3 rounded-xl border-2 border-primary bg-gray-700 px-4 py-2">
        <i className="ph ph-bold ph-user text-2xl text-primary" />
        <h3 className="text-base font-bold uppercase text-white">Contact</h3>
      </div>

      <div className="space-y-3 pl-2">
        {basics.phone && (
          <div className="flex items-start gap-x-3">
            <i className="ph ph-bold ph-phone text-xl text-primary" />
            <a href={`tel:${basics.phone}`} className="text-sm text-white break-words hover:text-primary">
              {basics.phone}
            </a>
          </div>
        )}
        {basics.email && (
          <div className="flex items-start gap-x-3">
            <i className="ph ph-bold ph-at text-xl text-primary" />
            <a href={`mailto:${basics.email}`} className="text-sm text-white break-words hover:text-primary">
              {basics.email}
            </a>
          </div>
        )}
        {basics.location && (
          <div className="flex items-start gap-x-3">
            <i className="ph ph-bold ph-map-pin text-xl text-primary" />
            <div className="text-sm text-white">{basics.location}</div>
          </div>
        )}
        {basics.url && isUrl(basics.url.href) && (
          <div className="flex items-start gap-x-3">
            <i className="ph ph-bold ph-link text-xl text-primary" />
            <a href={basics.url.href} className="text-sm text-white break-words hover:text-primary" target="_blank" rel="noreferrer">
              {basics.url.label || basics.url.href}
            </a>
          </div>
        )}
        {basics.customFields.map((item) => (
          <div key={item.id} className="flex items-start gap-x-3">
            <i className={cn(`ph ph-bold ph-${item.icon}`, "text-xl text-primary")} />
            {isUrl(item.value) ? (
              <a href={item.value} target="_blank" rel="noreferrer noopener nofollow" className="text-sm text-white hover:text-primary">
                {item.name || item.value}
              </a>
            ) : (
              <span className="text-sm text-white">{[item.name, item.value].filter(Boolean).join(": ")}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary" mainIcon="briefcase" sidebarIcon="briefcase">
      {(item) => (
        <div className="space-y-1">
          <div className={cn(
            "flex items-start justify-between gap-x-4",
            "group-[.sidebar]:flex-col group-[.sidebar]:gap-y-1"
          )}>
            <div className="flex-1 space-y-0.5">
              <LinkedEntity
                name={item.company}
                url={item.url}
                separateLinks={section.separateLinks}
                className={cn(
                  "text-base font-bold uppercase",
                  "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
                )}
              />
              <div className={cn(
                "text-sm font-semibold",
                "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
              )}>{item.position}</div>
              {item.location && (
                <div className={cn(
                  "text-sm text-gray-600",
                  "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-400"
                )}>{item.location}</div>
              )}
            </div>
            <div className={cn(
              "text-sm font-bold text-primary whitespace-nowrap",
              "group-[.sidebar]:text-xs"
            )}>{item.date}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

const Education = () => {
  const section = useArtboardStore((state) => state.resume.sections.education);

  return (
    <Section<Education> section={section} urlKey="url" summaryKey="summary" mainIcon="graduation-cap" sidebarIcon="graduation-cap">
      {(item) => (
        <div className="space-y-1">
          <LinkedEntity
            name={item.institution}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "text-base font-bold",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
            )}
          />
          <div className={cn(
            "text-sm",
            "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
          )}>{item.area}</div>
          {item.studyType && (
            <div className={cn(
              "text-sm uppercase text-gray-600",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-400"
            )}>{item.studyType}</div>
          )}
          {item.score && (
            <div className={cn(
              "text-sm text-gray-600",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-400"
            )}>{item.score}</div>
          )}
          <div className={cn(
            "text-sm font-bold text-primary",
            "group-[.sidebar]:text-xs"
          )}>{item.date}</div>
        </div>
      )}
    </Section>
  );
};

const Awards = () => {
  const section = useArtboardStore((state) => state.resume.sections.awards);

  return (
    <Section<Award> section={section} urlKey="url" summaryKey="summary" mainIcon="trophy" sidebarIcon="trophy">
      {(item) => (
        <div className="space-y-1">
          <div className={cn(
            "font-bold",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
          )}>{item.title}</div>
          <LinkedEntity 
            name={item.awarder} 
            url={item.url} 
            separateLinks={section.separateLinks}
            className={cn(
              "text-sm",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
            )}
          />
          <div className={cn(
            "text-sm font-bold text-primary",
            "group-[.sidebar]:text-xs"
          )}>{item.date}</div>
        </div>
      )}
    </Section>
  );
};

const Certifications = () => {
  const section = useArtboardStore((state) => state.resume.sections.certifications);

  return (
    <Section<Certification> section={section} urlKey="url" summaryKey="summary" mainIcon="certificate" sidebarIcon="certificate">
      {(item) => (
        <div className="space-y-1">
          <div className={cn(
            "font-bold",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
          )}>{item.name}</div>
          <LinkedEntity 
            name={item.issuer} 
            url={item.url} 
            separateLinks={section.separateLinks}
            className={cn(
              "text-sm",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
            )}
          />
          <div className={cn(
            "text-sm font-bold text-primary",
            "group-[.sidebar]:text-xs"
          )}>{item.date}</div>
        </div>
      )}
    </Section>
  );
};

const Skills = () => {
  const section = useArtboardStore((state) => state.resume.sections.skills);

  return (
    <Section<Skill> section={section} levelKey="level" keywordsKey="keywords" mainIcon="star" sidebarIcon="star">
      {(item) => (
        <div className="space-y-1.5">
          <div className={cn(
            "font-semibold uppercase",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
          )}>{item.name}</div>
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
            )}>{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Interests = () => {
  const section = useArtboardStore((state) => state.resume.sections.interests);

  return (
    <Section<Interest> section={section} keywordsKey="keywords" mainIcon="heart" sidebarIcon="heart">
      {(item) => (
        <div className={cn(
          "font-bold",
          "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
        )}>{item.name}</div>
      )}
    </Section>
  );
};

const Publications = () => {
  const section = useArtboardStore((state) => state.resume.sections.publications);

  return (
    <Section<Publication> section={section} urlKey="url" summaryKey="summary" mainIcon="book" sidebarIcon="book">
      {(item) => (
        <div className="space-y-1">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "font-bold",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
            )}
          />
          <div className={cn(
            "text-sm",
            "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
          )}>{item.publisher}</div>
          <div className={cn(
            "text-sm font-bold text-primary",
            "group-[.sidebar]:text-xs"
          )}>{item.date}</div>
        </div>
      )}
    </Section>
  );
};

const Volunteer = () => {
  const section = useArtboardStore((state) => state.resume.sections.volunteer);

  return (
    <Section<Volunteer> section={section} urlKey="url" summaryKey="summary" mainIcon="hand-heart" sidebarIcon="hand-heart">
      {(item) => (
        <div className="space-y-1">
          <LinkedEntity
            name={item.organization}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "font-bold",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
            )}
          />
          <div className={cn(
            "text-sm",
            "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
          )}>{item.position}</div>
          {item.location && (
            <div className={cn(
              "text-sm text-gray-600",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-400"
            )}>{item.location}</div>
          )}
          <div className={cn(
            "text-sm font-bold text-primary",
            "group-[.sidebar]:text-xs"
          )}>{item.date}</div>
        </div>
      )}
    </Section>
  );
};

const Languages = () => {
  const section = useArtboardStore((state) => state.resume.sections.languages);

  return (
    <Section<Language> section={section} levelKey="level" mainIcon="translate" sidebarIcon="translate">
      {(item) => (
        <div className="space-y-1">
          <div className={cn(
            "font-bold",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
          )}>{item.name}</div>
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
            )}>{item.description}</div>
          )}
        </div>
      )}
    </Section>
  );
};

const Projects = () => {
  const section = useArtboardStore((state) => state.resume.sections.projects);

  return (
    <Section<Project> section={section} urlKey="url" summaryKey="summary" keywordsKey="keywords" mainIcon="code" sidebarIcon="code">
      {(item) => (
        <div className="space-y-1">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "font-bold",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
            )}
          />
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
            )}>{item.description}</div>
          )}
          <div className={cn(
            "text-sm font-bold text-primary",
            "group-[.sidebar]:text-xs"
          )}>{item.date}</div>
        </div>
      )}
    </Section>
  );
};

const References = () => {
  const section = useArtboardStore((state) => state.resume.sections.references);

  return (
    <Section<Reference> section={section} urlKey="url" summaryKey="summary" mainIcon="user-check" sidebarIcon="user-check">
      {(item) => (
        <div className="space-y-1">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "font-bold",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
            )}
          />
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
            )}>{item.description}</div>
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
      mainIcon="folder"
      sidebarIcon="folder"
    >
      {(item) => (
        <div className="space-y-1">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "font-bold",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-white"
            )}
          />
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-300"
            )}>{item.description}</div>
          )}
          {item.date && (
            <div className={cn(
              "text-sm font-bold text-primary",
              "group-[.sidebar]:text-xs"
            )}>{item.date}</div>
          )}
          {item.location && (
            <div className={cn(
              "text-sm text-gray-600",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-gray-400"
            )}>{item.location}</div>
          )}
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

export const Azurill = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="space-y-0">
      {isFirstPage && <Header />}

      <div className="grid grid-cols-3 gap-x-0">
        {/* Sidebar - Dark Background */}
        <div className="sidebar group space-y-6 bg-gray-800 p-6">
          <ContactInfo />
          {sidebar.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>

        {/* Main Content - White Background */}
        <div className={cn(
          "main group space-y-6 bg-white p-6",
          sidebar.length > 0 ? "col-span-2" : "col-span-3"
        )}>
          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};