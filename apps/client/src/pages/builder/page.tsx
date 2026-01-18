import { t } from "@lingui/macro";
import type { ResumeDto } from "@reactive-resume/dto";
import { useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import type { LoaderFunction } from "react-router";
import { redirect } from "react-router";

import { queryClient } from "@/client/libs/query-client";
import { findResumeById } from "@/client/services/resume";
import { useBuilderStore } from "@/client/stores/builder";
import { useResumeStore } from "@/client/stores/resume";

export const BuilderPage = () => {
  const frameRef = useBuilderStore((state) => state.frame.ref);
  const setFrameRef = useBuilderStore((state) => state.frame.setRef);

  const resume = useResumeStore((state) => state.resume);
  const title = useResumeStore((state) => state.resume.title);

  const syncResumeToArtboard = useCallback(() => {
    setImmediate(() => {
      if (!frameRef?.contentWindow) return;
      const message = { type: "SET_RESUME", payload: resume.data };
      frameRef.contentWindow.postMessage(message, "*");
    });
  }, [frameRef?.contentWindow, resume.data]);


  
  // Send resume data to iframe on initial load
  useEffect(() => {
    if (!frameRef) return;

    frameRef.addEventListener("load", syncResumeToArtboard);

    return () => {
      frameRef.removeEventListener("load", syncResumeToArtboard);
    };
  }, [frameRef]);

  // Persistently check if iframe has loaded using setInterval
  useEffect(() => {
    const interval = setInterval(() => {
      if (frameRef?.contentWindow?.document.readyState === "complete") {
        syncResumeToArtboard();
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [frameRef]);

  // Send resume data to iframe on change of resume data
  useEffect(syncResumeToArtboard, [resume.data]);

  return (
    <>
      <Helmet>
        <title>
          {title} - {t`Inrah`}
        </title>
      </Helmet>

      <iframe
        ref={setFrameRef}
        title={resume.id}
        src="/artboard/builder"
        className="mt-16 w-screen"
        style={{ height: `calc(100vh - 64px)` }}
      />
    </>
  );
};

// export const builderLoader: LoaderFunction<ResumeDto> = async ({ params }) => {
//   try {
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     const id = params.id!;

//     const resume = await queryClient.fetchQuery({
//       queryKey: ["resume", { id }],
//       queryFn: () => findResumeById({ id }),
//     });

//     useResumeStore.setState({ resume });
//     useResumeStore.temporal.getState().clear();

//     return resume;
//   } catch {
//     return redirect("/dashboard");
//   }
// };


export const builderLoader: LoaderFunction<ResumeDto> = async ({ params }) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = params.id!;
    
    console.log('BuilderLoader: Loading resume', id);
    
    const token = localStorage.getItem('token');
    
    // Try to get resume data from user's local list first
    const allResumes = await queryClient.fetchQuery({
      queryKey: ["resumes"],
      queryFn: async () => {
        const response = await fetch('/api/resume', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        return response.json();
      },
    });
    
    let resume = allResumes.find((r: any) => r.id === id);
    
    if (resume) {
      console.log('Found resume in user list:', resume.id, 'AI:', resume.data?.metadata?.aiGenerated);
      
      // CRITICAL: Check if it's AI resume and fix structure
      const isAI = resume.data?.metadata?.aiGenerated;
      
      if (isAI) {
        console.log('AI resume detected, fixing structure...');
        resume = {
          ...resume,
          data: fixAIResumeStructure(resume.data),
        };
      }
      
      // Validate the structure before setting it
      validateResumeStructure(resume.data);
      
      useResumeStore.setState({ resume });
      useResumeStore.temporal.getState().clear();
      return resume;
    }
    
    console.log('Resume not in user list, trying API...');
    
    // Fallback to API
    const apiResume = await queryClient.fetchQuery({
      queryKey: ["resume", { id }],
      queryFn: () => findResumeById({ id }),
    });
    
    useResumeStore.setState({ resume: apiResume });
    useResumeStore.temporal.getState().clear();
    return apiResume;
    
  } catch (error) {
    console.error('BuilderLoader error:', error);
    return redirect("/dashboard");
  }
};

// Add these helper functions:

const fixAIResumeStructure = (data: any): any => {
  if (!data) return getDefaultResumeData();
  
  console.log('Fixing AI resume structure...');
  
  // Deep clone to avoid mutations
  const fixed = JSON.parse(JSON.stringify(data));
  
  // Ensure basics exists
  if (!fixed.basics || typeof fixed.basics !== 'object') {
    fixed.basics = {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      url: { label: "", href: "" },
      picture: {
        url: "",
        size: 128,
        aspectRatio: 1,
        borderRadius: 0,
        effects: { hidden: false, border: false, grayscale: false }
      },
      customFields: []
    };
  }
  
  // Ensure sections exists
  if (!fixed.sections || typeof fixed.sections !== 'object') {
    fixed.sections = {};
  }
  
  // Define all expected sections with their default structure
  const sectionTemplates = {
    summary: {
      name: "Summary",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "summary",
      content: "<p>Professional summary</p>"
    },
    awards: {
      name: "Awards",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "awards",
      items: []
    },
    certifications: {
      name: "Certifications",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "certifications",
      items: []
    },
    education: {
      name: "Education",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "education",
      items: []
    },
    experience: {
      name: "Experience",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "experience",
      items: []
    },
    volunteer: {
      name: "Volunteering",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "volunteer",
      items: []
    },
    interests: {
      name: "Interests",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "interests",
      items: []
    },
    languages: {
      name: "Languages",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "languages",
      items: []
    },
    profiles: {
      name: "Profiles",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "profiles",
      items: []
    },
    projects: {
      name: "Projects",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "projects",
      items: []
    },
    publications: {
      name: "Publications",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "publications",
      items: []
    },
    references: {
      name: "References",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "references",
      items: []
    },
    skills: {
      name: "Skills",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "skills",
      items: []
    },
    custom: {}
  };
  
  // Fix each section
  Object.entries(sectionTemplates).forEach(([sectionName, template]) => {
    const currentSection = fixed.sections[sectionName];
    
    if (!currentSection) {
      // Section doesn't exist, create it
      fixed.sections[sectionName] = { ...template };
    } else if (currentSection === null) {
      // Section is null, replace with template
      fixed.sections[sectionName] = { ...template };
    } else if (Array.isArray(currentSection)) {
      // Section is an array, convert to object
      fixed.sections[sectionName] = {
        ...template,
        items: currentSection,
        visible: currentSection.length > 0
      };
    } else if (typeof currentSection === 'object') {
      // Ensure section has all required properties
      fixed.sections[sectionName] = {
        ...template,
        ...currentSection,
        id: currentSection.id || sectionName,
        name: currentSection.name,
        columns: currentSection.columns,
        visible: currentSection.visible !== undefined ? currentSection.visible : template.visible,
        items: currentSection.items,
        content: currentSection.content,
      };
    }
    
    // Ensure items array exists and has IDs
    if (fixed.sections[sectionName].items && Array.isArray(fixed.sections[sectionName].items)) {
      fixed.sections[sectionName].items = fixed.sections[sectionName].items.map((item: any, index: number) => {
        if (!item || typeof item !== 'object') {
          return {
            id: generateCuid2(),
            visible: true,
            name: `${sectionName} Item ${index + 1}`
          };
        }
        
        return {
          ...item,
          id: item.id || generateCuid2(),
          visible: item.visible !== undefined ? item.visible : true
        };
      });
    }
  });
  
  // Ensure metadata exists
  if (!fixed.metadata || typeof fixed.metadata !== 'object') {
    fixed.metadata = {};
  }
  
  // Ensure AI metadata is preserved
  fixed.metadata = {
    template: "modern",
    layout: [
      [
        ["summary", "experience", "education", "references"],
        [
          "profiles",
          "skills",
          "certifications",
          "projects",
          "interests",
          "languages",
          "awards",
          "volunteer",
          "publications"
        ]
      ]
    ],
    css: { value: "", visible: false },
    page: {
      margin: 18,
      format: "a4",
      options: { breakLine: true, pageNumbers: true }
    },
    theme: {
      background: "#ffffff",
      text: "#000000",
      primary: "#3b82f6"
    },
    typography: {
      font: {
        family: "Inter",
        subset: "latin",
        variants: ["400", "500", "600", "700"],
        size: 13
      },
      lineHeight: 1.5,
      hideIcons: false,
      underlineLinks: true
    },
    notes: "",
    aiGenerated: true,
    aiGeneratedAt: fixed.metadata?.aiGeneratedAt || new Date().toISOString(),
    needsReview: fixed.metadata?.needsReview !== false,
    confidence: fixed.metadata?.confidence || 0.85,
    ...fixed.metadata,
  };
  
  console.log('Fixed AI resume structure');
  return fixed;
};

const validateResumeStructure = (data: any) => {
  if (!data) throw new Error('Resume data is null');
  
  // Check sections
  if (!data.sections || typeof data.sections !== 'object') {
    throw new Error('Resume sections is not an object');
  }
  
  // Check for null sections
  Object.entries(data.sections).forEach(([key, section]) => {
    if (section === null) {
      throw new Error(`Section ${key} is null`);
    }
    if (section && typeof section === 'object' && !section.id) {
      console.warn(`Section ${key} missing id property`);
    }
  });
  
  console.log('Resume structure validated OK');
};

const generateCuid2 = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'c';
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getDefaultResumeData = () => {
  return {
    basics: {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      url: { label: "", href: "" },
      picture: {
        url: "",
        size: 128,
        aspectRatio: 1,
        borderRadius: 0,
        effects: { hidden: false, border: false, grayscale: false }
      },
      customFields: []
    },
    sections: {
      summary: {
        name: "Summary",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "summary",
        content: "<p>Professional summary</p>"
      },
      education: {
        name: "Education",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "education",
        items: []
      },
      experience: {
        name: "Experience",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "experience",
        items: []
      },
      skills: {
        name: "Skills",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "skills",
        items: []
      },
      projects: {
        name: "Projects",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "projects",
        items: []
      },
      profiles: {
        name: "Profiles",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "profiles",
        items: []
      },
      awards: {
        name: "Awards",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "awards",
        items: []
      },
      certifications: {
        name: "Certifications",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "certifications",
        items: []
      },
      volunteer: {
        name: "Volunteering",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "volunteer",
        items: []
      },
      interests: {
        name: "Interests",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "interests",
        items: []
      },
      languages: {
        name: "Languages",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "languages",
        items: []
      },
      publications: {
        name: "Publications",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "publications",
        items: []
      },
      references: {
        name: "References",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "references",
        items: []
      },
      custom: {}
    },
    metadata: {
      template: "modern",
      layout: [
        [
          ["summary", "experience", "education", "references"],
          [
            "profiles",
            "skills",
            "certifications",
            "projects",
            "interests",
            "languages",
            "awards",
            "volunteer",
            "publications"
          ]
        ]
      ],
      css: { value: "", visible: false },
      page: {
        margin: 18,
        format: "a4",
        options: { breakLine: true, pageNumbers: true }
      },
      theme: {
        background: "#ffffff",
        text: "#000000",
        primary: "#3b82f6"
      },
      typography: {
        font: {
          family: "Inter",
          subset: "latin",
          variants: ["400", "500", "600", "700"],
          size: 13
        },
        lineHeight: 1.5,
        hideIcons: false,
        underlineLinks: true
      },
      notes: "",
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString(),
      needsReview: true,
      confidence: 0.85
    }
  };
};