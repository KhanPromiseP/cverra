// import html2pdf from 'html2pdf.js';

// interface Block {
//   id: string;
//   type: string;
//   content: string;
//   formatting?: {
//     fontSize?: string;
//     fontFamily?: string;
//     color?: string;
//     alignment?: string;
//     lineHeight?: string;
//     backgroundColor?: string;
//     fontWeight?: string;
//     fontStyle?: string;
//     textDecoration?: string;
//     padding?: string;
//     border?: string;
//     borderRadius?: string;
//   };
// }

// interface CoverLetter {
//   id: string;
//   title: string;
//   style: string;
//   content: {
//     blocks: Block[];
//     layout: any[];
//   };
// }

// export const exportToPDF = async (coverLetter: CoverLetter): Promise<void> => {
//   try {
//     // Wait a moment to ensure React has rendered everything
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     // Find the element
//     const targetElement = document.querySelector('[data-cover-letter-grid]') as HTMLElement;
    
//     if (!targetElement) {
//       throw new Error('Cover letter not found');
//     }
    
//     // Use window.html2pdf if available, or import dynamically
//     const html2pdf = (window as any).html2pdf || (await import('html2pdf.js')).default;
    
//     // Get current dimensions
//     const currentWidth = targetElement.offsetWidth;
//     const currentHeight = targetElement.offsetHeight;
    
//     // Set A4 dimensions for single page
//     // A4 at 96 DPI: 794px × 1123px
//     const A4_WIDTH_PX = 794;
//     const A4_HEIGHT_PX = 1123;
    
//     // Save original styles
//     const originalStyles = targetElement.style.cssText;
    
//     // Apply A4 dimensions directly to the element
//     targetElement.style.cssText = `
//       ${originalStyles}
//       width: ${A4_WIDTH_PX}px !important;
//       max-width: ${A4_WIDTH_PX}px !important;
//       max-height: ${A4_HEIGHT_PX}px !important;
//       overflow: hidden !important;
//       box-sizing: border-box !important;
//     `;
    
//     // Basic PDF generation - no fancy options that might trigger React
//     await html2pdf()
//       .from(targetElement)
//       .set({
//         margin: 0, // No margins since we control dimensions
//         filename: `${coverLetter.title || 'Cover Letter'}.pdf`,
//         image: { 
//           type: 'png' as const, 
//           quality: 1.0 
//         },
//         html2canvas: { 
//           scale: 2,
//           useCORS: true,
//           backgroundColor: '#FFFFFF',
//           width: A4_WIDTH_PX,
//           windowWidth: A4_WIDTH_PX,
//           windowHeight: A4_HEIGHT_PX,
//           scrollX: 0,
//           scrollY: 0,
//           onclone: (_, clonedElement) => {
//             // Add CSS to prevent page breaks
//             const style = document.createElement('style');
//             style.textContent = `
//               * {
//                 page-break-inside: avoid !important;
//                 break-inside: avoid !important;
//                 page-break-before: avoid !important;
//                 page-break-after: avoid !important;
//               }
//             `;
//             clonedElement.appendChild(style);
//           }
//         },
//         jsPDF: { 
//           unit: 'mm' as const, 
//           format: 'a4' as const, 
//           orientation: 'portrait' as const,
//           // ADD THIS LINE - it prevents the empty second page
//           putOnlyUsedFonts: true
//         },
//         // Prevent automatic page breaks
//         pagebreak: { mode: 'avoid-all' as const }
//       })
//       .save();
    
//     console.log('✅ Single-page PDF exported!');
    
//     // Restore original styles
//     targetElement.style.cssText = originalStyles;
    
//   } catch (error) {
//     console.error('Export failed:', error);
//     throw error;
//   }
// };


import html2pdf from 'html2pdf.js';

interface Block {
  id: string;
  type: string;
  content: string;
  formatting?: {
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    alignment?: string;
    lineHeight?: string;
    backgroundColor?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    padding?: string;
    border?: string;
    borderRadius?: string;
  };
}

interface CoverLetter {
  id: string;
  title: string;
  style: string;
  content: {
    blocks: Block[];
    layout: any[];
  };
}

export const exportToPDF = async (coverLetter: CoverLetter): Promise<void> => {
  try {
    console.log('🔄 Starting PDF export...');
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find the element
    const targetElement = document.querySelector('[data-cover-letter-grid]') as HTMLElement;
    
    if (!targetElement) {
      throw new Error('Cover letter content not found');
    }
    
    console.log('🎯 Exporting element:', {
      height: targetElement.scrollHeight,
      width: targetElement.scrollWidth,
      children: targetElement.children.length
    });
    
    // The SIMPLEST solution - just export with minimal options
    const options = {
      margin: 0.1, // Tiny margin
      filename: `${coverLetter.title || 'Cover Letter'}.pdf`,
      image: { 
        type: 'jpeg' as const, 
        quality: 0.95 
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        // Set the exact dimensions to capture
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight,
        windowWidth: targetElement.scrollWidth,
        windowHeight: targetElement.scrollHeight,
        // IMPORTANT: Disable auto-sizing
        onclone: (_:any, clonedElement:any) => {
  // Add critical CSS with !important for underline
  const style = document.createElement('style');
  style.textContent = `
    /* CRITICAL: Force underlines for all underlined elements */
    [data-block-type="subject_line"],
    [data-block-type="subject_line"] *,
    [style*="underline"],
    .subject-line,
    u, ins {
      text-decoration: underline !important;
      -webkit-text-decoration: underline !important;
      text-decoration-line: underline !important;
      text-decoration-style: solid !important;
      text-decoration-color: currentColor !important;
      text-decoration-thickness: auto !important;
    }
    
    /* Force underlines in print */
    @media print {
      [data-block-type="subject_line"],
      [data-block-type="subject_line"] *,
      [style*="underline"],
      .subject-line {
        text-decoration: underline !important;
        -webkit-text-decoration: underline !important;
      }
    }
    
    /* CRITICAL: Force single page */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      max-height: 1123px !important;
    }
    
    * {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    [data-cover-letter-grid] {
      max-height: 1123px !important;
      overflow: hidden !important;
    }
  `;
  clonedElement.appendChild(style);
}
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
        putOnlyUsedFonts: true,
        compress: true,
        // CRITICAL: This tells jsPDF to fit content to one page
        autoPaging: false
      },
      // CRITICAL: Disable page breaking
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    console.log('📄 Generating PDF...');
    
    // Generate PDF
    await html2pdf()
      .set(options)
      .from(targetElement)
      .save();
    
    console.log('✅ PDF exported successfully!');
    
  } catch (error) {
    console.error('❌ PDF export failed:', error);
    throw error;
  }
};