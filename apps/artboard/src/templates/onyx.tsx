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
    <div className="relative grid grid-cols-3 gap-0 overflow-hidden bg-gradient-to-br from-primary to-primary/80">
      {/* Floating organic shapes */}
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute right-20 top-10 h-32 w-32 rounded-full bg-white/5 blur-xl"></div>
      <div className="absolute left-1/3 -bottom-8 h-24 w-24 rounded-full bg-white/15 blur-lg"></div>
      
      {/* Wave pattern background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,30 Q20,10 40,30 T80,30 T120,30 T160,30 T200,30 T240,30 T280,30 T320,30 T360,30 T400,30 T440,30 T480,30 T520,30 T560,30 T600,30 T640,30 T680,30 T720,30 T760,30 T800,30 T840,30 T880,30 T920,30 T960,30 T1000,30 L1000,100 L0,100 Z" fill="white"/>
        </svg>
      </div>

      {/* Profile Picture Section with floating effect */}
      <div className="relative z-10 flex items-center justify-center p-8">
        {/* Animated floating circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-52 w-52 animate-float-slow rounded-full bg-gradient-to-br from-white/20 to-white/5 blur-xl"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-44 w-44 animate-float rounded-full bg-white/10"></div>
        </div>
        
        {/* Picture with elegant curved border and shadow */}
        <div className="relative rounded-3xl border-4 border-white/80 p-2 shadow-2xl backdrop-blur-sm">
          <div className="overflow-hidden rounded-2xl">
            <Picture size={180} className="rounded-2xl" />
          </div>
          {/* Decorative corner accents */}
          <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-primary/30 blur-sm"></div>
          <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-primary/40 blur-sm"></div>
        </div>
      </div>

      {/* Name and Title Section with curved glass morphism */}
      <div className="relative col-span-2 flex flex-col justify-center space-y-4 bg-white/95 p-10 backdrop-blur-sm">
        {/* Curved glass edge with gradient */}
        <div className="absolute -left-6 top-0 h-full w-24">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 C30,20 40,50 0,100 L100,100 L100,0 Z" fill="url(#glassGradient)" />
            <defs>
              <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.95" />
                <stop offset="100%" stopColor="white" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="relative z-10 space-y-3">
          <div className="space-y-2">
            <h1 className="text-5xl font-black uppercase tracking-tight text-foreground drop-shadow-sm">
              {basics.name}
            </h1>
            <div className="inline-block rounded-full bg-primary px-6 py-2 shadow-lg">
              <p className="text-lg font-semibold uppercase tracking-widest text-primary-foreground">
                {basics.headline}
              </p>
            </div>
          </div>
          
          {/* Animated decorative waves */}
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-16 rounded-full bg-primary/70 animate-pulse"></div>
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
            <div className="h-1 w-10 rounded-full bg-primary/60 animate-pulse delay-150"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping"></div>
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
      {/* Sidebar Style - Glass morphism with curved edges */}
      <div className="mb-4 hidden items-center gap-x-4 rounded-2xl bg-muted/80 p-4 backdrop-blur-sm group-[.sidebar]:flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
          <i className="ph ph-bold ph-user-circle text-2xl text-primary-foreground" />
        </div>
        <h4 className="text-base font-bold uppercase tracking-wide text-primary-foreground">{section.name}</h4>
      </div>

      {/* Main Style - Curved card with gradient border */}
      <div className="relative hidden overflow-hidden rounded-2xl group-[.main]:block">
        <div className="absolute inset-0 bg-primary opacity-20"></div>
        <div className="relative bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-xl">
              <i className="ph ph-bold ph-user-circle text-3xl text-primary-foreground" />
            </div>
            <h4 className="text-xl font-bold uppercase tracking-wide text-foreground">{section.name}</h4>
          </div>
        </div>
      </div>

      <main className={cn(
        "relative space-y-3",
        "group-[.main]:ml-6 group-[.main]:border-l-4 group-[.main]:border-primary group-[.main]:pl-6",
        "group-[.sidebar]:pl-3"
      )}>
        <div
          dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
          style={{ columns: section.columns }}
          className={cn(
            "wysiwyg text-sm leading-relaxed",
            "group-[.main]:text-muted-foreground",
            "group-[.sidebar]:text-muted"
          )}
        />
      </main>
    </section>
  );
};

type RatingProps = { level: number };

const Rating = ({ level }: RatingProps) => (
  <div className="relative h-3 w-full overflow-hidden rounded-2xl bg-muted shadow-inner group-[.sidebar]:bg-muted/50">
    <div 
      className="absolute inset-0 h-full bg-primary shadow-sm transition-all duration-700 ease-out"
      style={{ width: `${(level / 5) * 100}%` }}
    />
    <div className="absolute inset-0 h-full bg-gradient-to-r from-white/40 via-transparent to-transparent"></div>
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
    <div className="flex items-center gap-x-2">
      {!iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn("inline-block transition-all hover:text-primary hover:underline", className)}
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
      {/* Sidebar Header Style - Glass morphism */}
      <div className="hidden items-center gap-x-4 rounded-2xl bg-muted/80 p-4 backdrop-blur-sm group-[.sidebar]:flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
          <i className={cn(`ph ph-bold ph-${sidebarIcon}`, "text-2xl text-primary-foreground")} />
        </div>
        <h4 className="text-base font-bold uppercase tracking-wide text-primary-foreground">{section.name}</h4>
      </div>

      {/* Main Header Style - Gradient background */}
      <div className="relative hidden overflow-hidden rounded-2xl group-[.main]:block">
        <div className="absolute inset-0 bg-primary opacity-20"></div>
        <div className="relative bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-xl">
              <i className={cn(`ph ph-bold ph-${mainIcon}`, "text-3xl text-primary-foreground")} />
            </div>
            <h4 className="text-xl font-bold uppercase tracking-wide text-foreground">{section.name}</h4>
          </div>
        </div>
      </div>

      <div
        className="grid gap-x-6 gap-y-5"
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
                  "relative space-y-3 transition-all duration-300 hover:scale-[1.02]",
                  "group-[.main]:ml-6 group-[.main]:border-l-4 group-[.main]:border-primary group-[.main]:pl-8",
                  "group-[.sidebar]:ml-3 group-[.sidebar]:border-l-2 group-[.sidebar]:border-primary/50 group-[.sidebar]:pl-4",
                  className,
                )}
              >
                {/* Animated dot for main section */}
                <div className="absolute -left-[10px] top-0 hidden size-5 rounded-full border-4 border-background bg-primary shadow-lg group-[.main]:block" />
                
                {/* Glowing dot for sidebar section */}
                <div className="absolute -left-[6px] top-2 hidden size-3 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(var(--primary),0.5)] group-[.sidebar]:block" />

                <div>{children?.(item as T)}</div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
                    className={cn(
                      "wysiwyg text-sm leading-relaxed",
                      "group-[.main]:text-muted-foreground",
                      "group-[.sidebar]:text-muted"
                    )}
                  />
                )}

                {level !== undefined && level > 0 && <Rating level={level} />}

                {keywords !== undefined && keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          "group-[.main]:bg-primary/10 group-[.main]:text-primary",
                          "group-[.sidebar]:bg-muted group-[.sidebar]:text-primary-foreground"
                        )}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
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
        <div className="flex mb-2 items-center gap-x-3 transition-all duration-300 hover:translate-x-1">
          <div className="flex items-center justify-center rounded-xl shadow-md">
            <div className="text-lg text-primary-foreground">
              <BrandIcon slug={item.icon} />
            </div>
          </div>
          {isUrl(item.url.href) ? (
            <a 
              href={item.url.href} 
              className="text-sm transition-all hover:text-primary hover:underline" 
              target="_blank" 
              rel="noreferrer"
            >
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
    <section className="space-y-1">
      <div className="flex items-center gap-x-4 rounded-2xl bg-muted/80 p-1 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
          <i className="ph ph-bold ph-address-book text-2xl text-primary-foreground" />
        </div>
        <h3 className="text-base font-bold uppercase tracking-wide text-primary-foreground">Contact</h3>
      </div>

      <div className="">
        {basics.phone && (
          <div className="group flex items-center gap-x-3 rounded-xl bg-muted/50 px-3 transition-all hover:bg-muted/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <i className="ph ph-bold ph-phone text-lg text-primary" />
            </div>
            <a href={`tel:${basics.phone}`} className="flex-1 text-sm text-primary-foreground transition-all hover:text-primary">
              {basics.phone}
            </a>
          </div>
        )}
        {basics.email && (
          <div className="group flex items-center gap-x-3 rounded-xl bg-muted/50 px-3 transition-all hover:bg-muted/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <i className="ph ph-bold ph-at text-lg text-primary" />
            </div>
            <a href={`mailto:${basics.email}`} className="flex-1 text-sm text-primary-foreground transition-all hover:text-primary">
              {basics.email}
            </a>
          </div>
        )}
        {basics.location && (
          <div className="group flex items-center gap-x-3 rounded-xl bg-muted/50 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <i className="ph ph-bold ph-map-pin text-lg text-primary" />
            </div>
            <div className="flex-1 text-sm text-primary-foreground">{basics.location}</div>
          </div>
        )}
        {basics.url && isUrl(basics.url.href) && (
          <div className="group flex items-center gap-x-3 rounded-xl bg-muted/50 px-3 transition-all hover:bg-muted/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <i className="ph ph-bold ph-link text-lg text-primary" />
            </div>
            <a href={basics.url.href} className="flex-1 text-sm text-primary-foreground transition-all hover:text-primary" target="_blank" rel="noreferrer">
              {basics.url.label || basics.url.href}
            </a>
          </div>
        )}
        {basics.customFields.map((item) => (
          <div key={item.id} className="group flex items-center gap-x-3 rounded-xl bg-muted/50 px-3 transition-all hover:bg-muted/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <i className={cn(`ph ph-bold ph-${item.icon}`, "text-lg text-primary")} />
            </div>
            {isUrl(item.value) ? (
              <a href={item.value} target="_blank" rel="noreferrer noopener nofollow" className="flex-1 text-sm text-primary-foreground transition-all hover:text-primary">
                {item.name || item.value}
              </a>
            ) : (
              <span className="flex-1 text-sm text-primary-foreground">{[item.name, item.value].filter(Boolean).join(": ")}</span>
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
        <div className="space-y-2">
          <div className={cn(
            "flex items-start justify-between gap-x-4",
            "group-[.sidebar]:flex-col group-[.sidebar]:gap-y-2"
          )}>
            <div className="flex-1 space-y-1">
              <LinkedEntity
                name={item.company}
                url={item.url}
                separateLinks={section.separateLinks}
                className={cn(
                  "text-lg font-bold",
                  "group-[.main]:text-foreground",
                  "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
                )}
              />
              <div className={cn(
                "text-base font-semibold",
                "group-[.main]:text-primary",
                "group-[.sidebar]:text-sm group-[.sidebar]:text-primary/80"
              )}>{item.position}</div>
              {item.location && (
                <div className={cn(
                  "flex items-center gap-x-2 text-sm",
                  "group-[.main]:text-muted-foreground",
                  "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
                )}>
                  <i className="ph ph-bold ph-map-pin text-primary"></i>
                  {item.location}
                </div>
              )}
            </div>
            <div className={cn(
              "rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg",
              "group-[.sidebar]:text-xs"
            )}>
              {item.date}
            </div>
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
        <div className="space-y-2">
          <LinkedEntity
            name={item.institution}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "text-lg font-bold",
              "group-[.main]:text-foreground",
              "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
            )}
          />
          <div className={cn(
            "text-base font-medium",
            "group-[.main]:text-primary",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-primary/80"
          )}>{item.area}</div>
          {item.studyType && (
            <div className={cn(
              "text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
            )}>{item.studyType}</div>
          )}
          {item.score && (
            <div className={cn(
              "inline-flex items-center gap-x-2 rounded-full px-3 py-1 text-sm font-semibold",
              "group-[.main]:bg-primary/10 group-[.main]:text-primary",
              "group-[.sidebar]:bg-muted group-[.sidebar]:text-primary-foreground"
            )}>
              <i className="ph ph-bold ph-medal text-primary"></i>
              {item.score}
            </div>
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
        <div className="space-y-2">
          <div className={cn(
            "text-lg font-bold",
            "group-[.main]:text-foreground",
            "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
          )}>{item.title}</div>
          <LinkedEntity 
            name={item.awarder} 
            url={item.url} 
            separateLinks={section.separateLinks}
            className={cn(
              "text-base font-medium",
              "group-[.main]:text-primary",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-primary/80"
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
        <div className="space-y-2">
          <div className={cn(
            "text-lg font-bold",
            "group-[.main]:text-foreground",
            "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
          )}>{item.name}</div>
          <LinkedEntity 
            name={item.issuer} 
            url={item.url} 
            separateLinks={section.separateLinks}
            className={cn(
              "text-base font-medium",
              "group-[.main]:text-primary",
              "group-[.sidebar]:text-sm group-[.sidebar]:text-primary/80"
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
        <div className="space-y-2">
          <div className={cn(
            "font-bold uppercase tracking-wide",
            "group-[.main]:text-foreground",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-primary-foreground"
          )}>{item.name}</div>
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
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
          "group-[.main]:text-foreground",
          "group-[.sidebar]:text-sm group-[.sidebar]:text-primary-foreground"
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
        <div className="space-y-2">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "text-lg font-bold",
              "group-[.main]:text-foreground",
              "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
            )}
          />
          <div className={cn(
            "text-base font-medium",
            "group-[.main]:text-primary",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-primary/80"
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
        <div className="space-y-2">
          <LinkedEntity
            name={item.organization}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "text-lg font-bold",
              "group-[.main]:text-foreground",
              "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
            )}
          />
          <div className={cn(
            "text-base font-medium",
            "group-[.main]:text-primary",
            "group-[.sidebar]:text-sm group-[.sidebar]:text-primary/80"
          )}>{item.position}</div>
          {item.location && (
            <div className={cn(
              "flex items-center gap-x-2 text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
            )}>
              <i className="ph ph-bold ph-map-pin text-primary"></i>
              {item.location}
            </div>
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
        <div className="space-y-2">
          <div className={cn(
            "text-lg font-bold",
            "group-[.main]:text-foreground",
            "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
          )}>{item.name}</div>
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
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
        <div className="space-y-2">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "text-lg font-bold",
              "group-[.main]:text-foreground",
              "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
            )}
          />
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
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
        <div className="space-y-2">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "text-lg font-bold",
              "group-[.main]:text-foreground",
              "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
            )}
          />
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
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
        <div className="space-y-2">
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={section.separateLinks}
            className={cn(
              "text-lg font-bold",
              "group-[.main]:text-foreground",
              "group-[.sidebar]:text-base group-[.sidebar]:text-primary-foreground"
            )}
          />
          {item.description && (
            <div className={cn(
              "text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
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
              "flex items-center gap-x-2 text-sm",
              "group-[.main]:text-muted-foreground",
              "group-[.sidebar]:text-xs group-[.sidebar]:text-muted"
            )}>
              <i className="ph ph-bold ph-map-pin text-primary"></i>
              {item.location}
            </div>
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

export const Onyx = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="space-y-0">
      {isFirstPage && <Header />}

      <div className="grid grid-cols-3 gap-x-0">
        {/* Sidebar - Dark Glass Morphism */}
        <div className="sidebar group space-y-6 bg-muted p-6">
          {/* Background shapes for sidebar */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary"></div>
            <div className="absolute -right-10 top-10 h-32 w-32 rounded-full bg-primary blur-xl"></div>
            <div className="absolute right-[320px] top-[130px] h-40 w-40 rounded-full bg-primary blur-xl"></div>
         
          </div>
          <div className="relative z-10">
            <ContactInfo />
            {sidebar.map((section) => (
              <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
            ))}
          </div>
        </div>

        {/* Main Content - Light with subtle gradient */}
        <div className={cn(
          "main group space-y-6 bg-background p-6 backdrop",
          sidebar.length > 0 ? "col-span-2" : "col-span-3"
        )}>
          
          <div className="relative z-10">
            {main.map((section) => (
              <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};