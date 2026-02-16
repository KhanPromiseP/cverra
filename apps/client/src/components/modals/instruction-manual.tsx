// components/instruction-manual.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@reactive-resume/ui";
import { Button } from "@reactive-resume/ui";
import { X, FileText, Briefcase, GraduationCap, Wrench, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { t, Trans } from "@lingui/macro";

interface InstructionManualProps {
  open: boolean;
  onClose: () => void;
}

export const InstructionManual = ({ open, onClose }: InstructionManualProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <WarningCircle size={20} />
            <Trans>Important Instructions for Best Results</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Follow these guidelines to get the best resume from Inlirah resume builder AI-model</Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <WarningCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                  <Trans>For Best AI Results:</Trans>
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                  <Trans>
                    Our AI-model extracts information from your document. The more complete and structured your input,
                    the better your generated resume will be.
                  </Trans>
                </p>
              </div>
            </div>
          </div>

          {/* Essential Information Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-gray-200">
              <Sparkle size={18} className="text-purple-500" />
              <Trans>Essential Information to Include:</Trans>
            </h3>
            
            <div className="space-y-3">
              {/* Personal Information */}
              <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    <Trans>Personal Information</Trans>
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400/80 mt-1 space-y-1 list-disc pl-4">
                    <li><Trans>Full Name</Trans></li>
                    <li><Trans>Email Address</Trans></li>
                    <li><Trans>Phone Number</Trans></li>
                    <li><Trans>Location (City, Country)</Trans></li>
                    <li><Trans>Professional Title/Headline</Trans></li>
                    <li><Trans>LinkedIn Profile or Website</Trans></li>
                  </ul>
                </div>
              </div>

              {/* Work Experience */}
              <div className="flex gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div className="flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300">
                    <Trans>Work Experience (Most Important!)</Trans>
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-400/80 mt-1 space-y-1 list-disc pl-4">
                    <li><Trans>Company Names</Trans></li>
                    <li><Trans>Job Titles/Positions</Trans></li>
                    <li><Trans>Employment Dates (Month/Year)</Trans></li>
                    <li><Trans>Key Responsibilities & Achievements</Trans></li>
                    <li><Trans>Projects worked on</Trans></li>
                    <li><Trans>Technologies used</Trans></li>
                  </ul>
                  <p className="text-xs text-green-600 dark:text-green-500/80 mt-2 font-medium">
                    <Trans>Pro Tip: Include bullet points with specific achievements and metrics</Trans>
                  </p>
                </div>
              </div>

              {/* Education */}
              <div className="flex gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                <div className="flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-800 dark:text-purple-300">
                    <Trans>Education</Trans>
                  </h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-400/80 mt-1 space-y-1 list-disc pl-4">
                    <li><Trans>University/College Names</Trans></li>
                    <li><Trans>Degrees Earned</Trans></li>
                    <li><Trans>Field of Study</Trans></li>
                    <li><Trans>Graduation Dates</Trans></li>
                    <li><Trans>GPA or Academic Honors</Trans></li>
                    <li><Trans>Relevant Courses</Trans></li>
                  </ul>
                </div>
              </div>

              {/* Skills */}
              <div className="flex gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <div className="flex-shrink-0">
                  <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium text-orange-800 dark:text-orange-300">
                    <Trans>Skills & Technologies</Trans>
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-400/80 mt-1 space-y-1 list-disc pl-4">
                    <li><Trans>Programming Languages</Trans></li>
                    <li><Trans>Frameworks & Libraries</Trans></li>
                    <li><Trans>Tools & Platforms</Trans></li>
                    <li><Trans>Soft Skills</Trans></li>
                    <li><Trans>Languages Spoken</Trans></li>
                    <li><Trans>Certifications</Trans></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Format Tips */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg dark:text-gray-200">
              <Trans>Recommended Format:</Trans>
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`John Doe - Software Engineer
john.doe@email.com | +1 (123) 456-7890 | San Francisco, CA

EXPERIENCE:
Senior Software Engineer at Tech Corp (Jan 2020 - Present)
- Led development of microservices architecture improving performance by 40%
- Implemented CI/CD pipeline reducing deployment time by 60%
- Mentored 3 junior developers on React and Node.js best practices

EDUCATION:
Master of Science in Computer Science
Stanford University (2016 - 2018)
GPA: 3.8/4.0

SKILLS:
JavaScript, TypeScript, React, Node.js, AWS, Docker, Python
Leadership, Problem Solving, Agile Methodologies`}
              </pre>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <Trans>The AI works best with clear sections and bullet points</Trans>
              </p>
            </div>
          </div>

          {/* File Tips */}
          <div className="space-y-2">
            <h3 className="font-semibold dark:text-gray-200">
              <Trans>File Upload Tips:</Trans>
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
              <li><Trans>Use PDF or DOC files with selectable text (not scanned images)</Trans></li>
              <li><Trans>Ensure your document is properly formatted with clear headings</Trans></li>
              <li><Trans>For best results, use an existing resume or detailed LinkedIn profile</Trans></li>
              <li><Trans>Check that all important information is included before uploading</Trans></li>
            </ul>
          </div>

          {/* What to Expect */}
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800/50">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
              <Trans>What the AI will do:</Trans>
            </h4>
            <ul className="text-sm text-purple-700 dark:text-purple-400/80 space-y-1 list-disc pl-4">
              <li><Trans>Extract and organize information into proper resume sections</Trans></li>
              <li><Trans>Create a professional summary based on your experience</Trans></li>
              <li><Trans>Format dates, locations, and achievements consistently</Trans></li>
              <li><Trans>Generate skill categories and proficiency levels</Trans></li>
              <li><Trans>Structure everything into an editable resume template</Trans></li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            <Trans>I Understand, Let's Proceed</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};