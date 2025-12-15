// components/article-editor/JoditWrapper.tsx
import React, { useMemo, useState, useRef } from 'react';
import JoditEditor, { IJoditEditorProps } from 'jodit-react';
import { message, Upload, Button, Row, Col, Space, Modal } from 'antd';
import { 
  UploadOutlined, 
  PictureOutlined, 
  PlusOutlined,
  LayoutOutlined,
  ColumnWidthOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  GifOutlined,
  IeOutlined
} from '@ant-design/icons';

interface JoditWrapperProps {
  value: string;
  onChange: (content: string) => void;
  disabled?: boolean;
  height?: number;
  placeholder?: string;
  uploadEndpoint?: string;
}

const JoditWrapper: React.FC<JoditWrapperProps> = ({
  value,
  onChange,
  disabled = false,
  height = 600,
  placeholder = 'Start writing your amazing article...',
  uploadEndpoint = '/api/upload/image'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const editorRef = useRef<any>(null);

  // Custom image upload handler
  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      message.success('Image uploaded successfully');
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload image');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Layout Templates with Beautiful Styling
  const layoutTemplates = {
    // 3 Images Horizontal Grid
    threeImagesHorizontal: () => `
      <div class="my-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div class="relative group">
            <div class="aspect-square rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all duration-300">
              <div class="text-center p-4">
                <div class="text-4xl mb-2">🖼️</div>
                <p class="text-sm text-gray-600">Click to upload image 1</p>
              </div>
            </div>
           
          </div>
          <div class="relative group">
            <div class="aspect-square rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-400 transition-all duration-300">
              <div class="text-center p-4">
                <div class="text-4xl mb-2">🖼️</div>
                <p class="text-sm text-gray-600">Click to upload image 2</p>
              </div>
            </div>

          </div>
          <div class="relative group">
            <div class="aspect-square rounded-xl flex items-center justify-center cursor-pointer hover:border-green-400 transition-all duration-300">
              <div class="text-center p-4">
                <div class="text-4xl mb-2">🖼️</div>
                <p class="text-sm text-gray-600">Click to upload image 3</p>
              </div>
            </div>
       
          </div>
        </div>
        <p class="text-center text-gray-500 text-sm italic">Three image horizontal gallery with captions</p>
      </div>
    `,

    // Image Left, Text Right (Modern Card)
imageLeftTextRight: () => `
  <div style="margin: 2rem 0; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e5e7eb;">
    <div style="display: flex; flex-direction: row; flex-wrap: nowrap;">
      <!-- Image Section (Left - 40%) -->
      <div style="flex: 2; min-width: 40%; position: relative;">
        <div style="height: 100%; min-height: 300px; background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem;">
          <div style="text-align: center; margin-bottom: 1rem;">
            <div style="font-size: 3.75rem; line-height: 1; margin-bottom: 1rem;">📷</div>
            <h4 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Your Visual Content</h4>
            <p style="color: #4b5563;">Upload or drag & drop your image here</p>
          </div>
          <div style="width: 100%; max-width: 20rem;">
            <div style="border: 2px dashed #d1d5db; border-radius: 0.75rem; padding: 1rem; text-align: center; cursor: pointer; transition: border-color 0.3s;">
              <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⬆️</div>
              <p style="font-size: 0.875rem; color: #374151; font-weight: 500;">Click to upload</p>
              <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>
        <div style="position: absolute; bottom: 1rem; right: 1rem;">
          <div style="background-color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; color: #374151; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
            Image Section
          </div>
        </div>
      </div>
      
      <!-- Text Section (Right - 60%) -->
      <div style="flex: 3; min-width: 60%; padding: 2rem;">
        <div style="margin-bottom: 1.5rem;">
          <span style="display: inline-block; padding: 0.25rem 1rem; border-radius: 9999px; background: linear-gradient(to right, #3b82f6, #4f46e5); color: white; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.75rem;">Featured</span>
          <h3 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 1rem;">Visual Content Layout</h3>
          <p style="color: #374151; font-size: 1.125rem; line-height: 1.625;">Create compelling content with this image-on-left, text-on-right layout. Perfect for showcasing visuals with supporting details.</p>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 1rem;">
            <div style="width: 3rem; height: 3rem; border-radius: 0.75rem; background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
              <span style="font-size: 1.25rem;">✨</span>
            </div>
            <div>
              <h4 style="font-size: 1rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem; margin-top: 0;">Visual First Approach</h4>
              <p style="color: #4b5563;">Images grab attention first, then text provides context and details.</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 3rem; height: 3rem; border-radius: 0.75rem; background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
              <span style="font-size: 1.25rem;">🎨</span>
            </div>
            <div>
              <h4 style="font-size: 1rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem; margin-top: 0;">Balanced Design</h4>
              <p style="color: #4b5563;">Perfect balance between visual impact and textual information.</p>
            </div>
          </div>
        </div>
        
        <div style="background-color: #f9fafb; border-radius: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb;">
          <p style="font-size: 0.875rem; color: #4b5563; font-style: italic;">Tip: Replace the placeholder image with your own content. All text is fully editable.</p>
        </div>
      </div>
    </div>
  </div>
`,

textLeftImageRight: () => `
  <div style="margin: 2rem 0; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e5e7eb;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <!-- Text Section (Left - 60%) -->
        <td style="width: 60%; vertical-align: top; padding: 2rem;">
          <div style="margin-bottom: 1.5rem;">
            <span style="display: inline-block; padding: 0.25rem 1rem; border-radius: 9999px; background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.75rem;">Premium</span>
            <h3 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 1rem;">Engaging Content Layout</h3>
            <p style="color: #374151; font-size: 1.125rem; line-height: 1.625;">Create compelling content with this text-on-left, image-on-right layout. Perfect for feature highlights and detailed explanations.</p>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 1rem;">
              <div style="width: 3rem; height: 3rem; border-radius: 0.75rem; background: linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%); display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                <span style="font-size: 1.25rem;">🎯</span>
              </div>
              <div>
                <h4 style="font-size: 1rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem; margin-top: 0;">Focus on Message</h4>
                <p style="color: #4b5563;">Text first ensures readers focus on your message before visual elements.</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start;">
              <div style="width: 3rem; height: 3rem; border-radius: 0.75rem; background: linear-gradient(135deg, #dbeafe 0%, #cffafe 100%); display: flex; align-items: center; justify-content: center; margin-right: 1rem; flex-shrink: 0;">
                <span style="font-size: 1.25rem;">💫</span>
              </div>
              <div>
                <h4 style="font-size: 1rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem; margin-top: 0;">Visual Impact</h4>
                <p style="color: #4b5563;">Supporting image on the right creates strong visual reinforcement.</p>
              </div>
            </div>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb;">
            <p style="font-size: 0.875rem; color: #4b5563; font-style: italic;">Tip: Replace the placeholder image with your own content. All text is fully editable.</p>
          </div>
        </td>
        
        <!-- Image Section (Right - 40%) -->
        <td style="width: 40%; vertical-align: top; position: relative;">
          <div style="height: 100%; min-height: 300px; background: linear-gradient(135deg, #fffbeb 0%, #ffedd5 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem;">
            <div style="text-align: center; margin-bottom: 1rem;">
              <div style="font-size: 3.75rem; line-height: 1; margin-bottom: 1rem;">📸</div>
              <h4 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Your Visual Content</h4>
              <p style="color: #4b5563;">Upload or drag & drop your image here</p>
            </div>
            <div style="width: 100%; max-width: 20rem;">
              <div style="border: 2px dashed #d1d5db; border-radius: 0.75rem; padding: 1rem; text-align: center; cursor: pointer; transition: border-color 0.3s;">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⬆️</div>
                <p style="font-size: 0.875rem; color: #374151; font-weight: 500;">Click to upload</p>
                <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>
          <div style="position: absolute; bottom: 1rem; right: 1rem;">
            <div style="background-color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; color: #374151; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
              Image Section
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
`,
    // Image Grid Gallery (2x2)
    imageGrid2x2: () => `
      <div class="my-8">
        <div class="mb-6 text-center">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Image Gallery</h3>
          <p class="text-gray-600">Beautiful 2x2 grid layout for showcasing multiple images</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Grid Item 1 -->
          <div class="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500">
            <div class="aspect-video bg-gradient-to-br from-cyan-100 to-blue-200 flex items-center justify-center">
              <div class="text-center">
                <div class="text-5xl mb-3">🌅</div>
                <p class="font-medium text-gray-800">Landscape Image</p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="p-4 bg-white">
              <input type="text" class="w-full text-lg font-semibold border-none focus:outline-none focus:ring-0" placeholder="Image Title" value="Beautiful Landscape" />
              <textarea class="w-full mt-2 text-sm text-gray-600 border-none focus:outline-none focus:ring-0 resize-none" placeholder="Description" rows="2">A stunning view of mountains and lakes during sunset.</textarea>
            </div>
          </div>
          
          <!-- Grid Item 2 -->
          <div class="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500">
            <div class="aspect-video bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
              <div class="text-center">
                <div class="text-5xl mb-3">🏙️</div>
                <p class="font-medium text-gray-800">Cityscape</p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="p-4 bg-white">
              <input type="text" class="w-full text-lg font-semibold border-none focus:outline-none focus:ring-0" placeholder="Image Title" value="Urban Cityscape" />
              <textarea class="w-full mt-2 text-sm text-gray-600 border-none focus:outline-none focus:ring-0 resize-none" placeholder="Description" rows="2">Modern city skyline at night with illuminated buildings.</textarea>
            </div>
          </div>
          
          <!-- Grid Item 3 -->
          <div class="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500">
            <div class="aspect-video bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
              <div class="text-center">
                <div class="text-5xl mb-3">🌿</div>
                <p class="font-medium text-gray-800">Nature</p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="p-4 bg-white">
              <input type="text" class="w-full text-lg font-semibold border-none focus:outline-none focus:ring-0" placeholder="Image Title" value="Forest Pathway" />
              <textarea class="w-full mt-2 text-sm text-gray-600 border-none focus:outline-none focus:ring-0 resize-none" placeholder="Description" rows="2">Sunlight filtering through trees in a peaceful forest.</textarea>
            </div>
          </div>
          
          <!-- Grid Item 4 -->
          <div class="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500">
            <div class="aspect-video bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
              <div class="text-center">
                <div class="text-5xl mb-3">🏖️</div>
                <p class="font-medium text-gray-800">Beach</p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="p-4 bg-white">
              <input type="text" class="w-full text-lg font-semibold border-none focus:outline-none focus:ring-0" placeholder="Image Title" value="Tropical Beach" />
              <textarea class="w-full mt-2 text-sm text-gray-600 border-none focus:outline-none focus:ring-0 resize-none" placeholder="Description" rows="2">White sand and turquoise waters of a tropical paradise.</textarea>
            </div>
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-500 italic">Each image box is fully editable. Click to upload images and edit text.</p>
        </div>
      </div>
    `,

    // Feature Card with Icon + Text
    featureCard: () => `
      <div class="my-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Feature 1 -->
          <div class="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 group">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl text-white">🚀</span>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-3">High Performance</h4>
            <p class="text-gray-700 mb-4">Lightning fast rendering and smooth editing experience for all your content needs.</p>
            <div class="flex items-center text-blue-600 text-sm font-medium">
              <span>Learn more</span>
              <span class="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
          
          <!-- Feature 2 -->
          <div class="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300 group">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl text-white">🎨</span>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-3">Beautiful Design</h4>
            <p class="text-gray-700 mb-4">Elegant layouts and stunning visual components that make your content stand out.</p>
            <div class="flex items-center text-purple-600 text-sm font-medium">
              <span>Learn more</span>
              <span class="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
          
          <!-- Feature 3 -->
          <div class="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-300 group">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl text-white">⚡</span>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-3">Easy to Use</h4>
            <p class="text-gray-700 mb-4">Intuitive interface with drag & drop functionality that anyone can master quickly.</p>
            <div class="flex items-center text-green-600 text-sm font-medium">
              <span>Learn more</span>
              <span class="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </div>
    `
  };

  // Advanced configuration with custom styling
  const config = useMemo<IJoditEditorProps['config']>(() => ({
    readonly: disabled,
    placeholder,
    minHeight: height,
    maxHeight: 800,
    
    // Custom styling with Tailwind classes
    style: {
      '--jodit-primary-color': '#3b82f6',
      '--jodit-border-color': '#e5e7eb',
      '--jodit-toolbar-background-color': '#f9fafb',
      '--jodit-toolbar-button-active-bg': '#dbeafe',
      '--jodit-toolbar-button-active-color': '#1d4ed8',
      '--jodit-color': '#374151',
      '--jodit-font-size': '16px',
      '--jodit-line-height': '1.75',
    },
    
    // Enhanced toolbar with layout buttons
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|',
      'fontsize', 'font', 'brush', 'paragraph', '|',
      'align', 'ul', 'ol', 'outdent', 'indent', '|',
      'image', 'video', 'file', 'table', 'link', '|',
      'hr', 'symbol', '|',
      'fullsize', 'preview', 'print', '|',
      'undo', 'redo', '|',
      'source', 'search', 'about'
    ],
    
    // Custom upload handler
    uploader: {
      url: uploadEndpoint,
      isSuccess: (resp) => resp.success,
      getMessage: (resp) => resp.message || '',
      process: (resp) => ({
        files: resp.files || [],
        path: resp.path || '',
        baseurl: resp.baseurl || '',
        error: resp.error || 0,
        message: resp.message || ''
      }),
      defaultHandlerSuccess: (data) => {
        const editor = editorRef.current;
        if (editor && data.files && data.files.length > 0) {
          data.files.forEach((filename: string) => {
            const url = data.baseurl + filename;
            editor.s.insertImage(url, null, 350);
          });
        }
      },
      error: (e) => {
        message.error(`Upload error: ${e.message}`);
      }
    },
    
    // Enable all plugins
    enableDragAndDropFileToEditor: true,
    allowResizeX: true,
    allowResizeY: true,
    showTooltip: true,
    showTooltipDelay: 500,
    
    // Advanced table options
    table: {
      allowCellSelection: true,
      allowCellResize: true,
      useExtraClasses: true,
    },
    
    // Link options
    link: {
      noFollowCheckbox: true,
      openInNewTabCheckbox: true,
    },
    
    // Enhanced events for advanced layouts
    events: {
  afterInsertImage: (editor: any, image: HTMLImageElement) => { // ✅ Add editor parameter
    // Add basic Tailwind classes only
    image.style.borderRadius = '8px';
    image.style.maxWidth = '100%';
    image.style.height = 'auto';
    image.style.margin = '1em 0';
    
    // Simple wrapper - no complex DOM manipulation
    const wrapper = document.createElement('div');
    wrapper.style.margin = '1em 0';
    wrapper.style.position = 'relative';
    
    if (image.parentNode) {
      image.parentNode.replaceChild(wrapper, image);
      wrapper.appendChild(image);
    }
    
    // Add simple caption
    const caption = document.createElement('div');
    caption.style.textAlign = 'center';
    caption.style.fontSize = '0.875rem';
    caption.style.color = '#6b7280';
    caption.style.fontStyle = 'italic';
    caption.style.marginTop = '0.5em';
    caption.contentEditable = 'true';
    caption.innerHTML = '<em>Image caption (click to edit)</em>';
    wrapper.appendChild(caption);
  },
  
  afterPaste: () => { // ✅ Remove ClipboardEvent parameter
    const editor = editorRef.current;
    if (editor) {
      setTimeout(() => {
        editor.e.fire('sanitizeHTML');
      }, 100);
    }
  }
},
    
    // Enhanced custom buttons with layout options
    extraButtons: [
      {
        name: 'uploadImage',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTE5IDEzaC02djZoLTJ2LTZINS0ybDctNzdMNjAgMTN6Ii8+PC9zdmc+',
        exec: (editor: any) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true;
          input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              for (const file of Array.from(files)) {
                try {
                  const url = await handleImageUpload(file);
                  editor.s.insertImage(url, null, 300);
                } catch (error) {
                  console.error('Image insert failed:', error);
                }
              }
            }
          };
          input.click();
        }
      },
      {
        name: 'showLayouts',
        tooltip: 'Insert Layout Templates',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTMgMThoMTh2LTJIM3Yyem0wLTVoMTh2LTJIM3Yyem0wLTd2MmgxOFY2SDN6Ii8+PC9zdmc+',
        exec: (editor: any) => {
          setShowLayoutModal(true);
        }
      },
      {
        name: 'insertThreeImages',
        tooltip: '3 Images Horizontal',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTIgNmg2djZIMnYtNnptMiA0aDJWOGgydjJ6bTQtNHY2aDZ2LTZIOHptMiA0aDJWOGgydjJ6bTQtNHY2aDJjMS4xIDAgMi0uOSAyLTJ2LTRoLTR6Ii8+PC9zdmc+',
        exec: (editor: any) => {
          editor.s.insertHTML(layoutTemplates.threeImagesHorizontal());
          message.success('3-image layout inserted');
        }
      },
      {
        name: 'insertImageLeftText',
        tooltip: 'Image Left, Text Right',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTkgMTBoNnY0SDl2LTR6bTQgMmgydjJIMTN2LTJ6bTQtNmg2djRIMTd2LTR6bTQgMmgydjJIMjF2LTJ6TTMgNGgxOHYxNkgzVjR6bTggMTBoNFY4SDExdjZ6bTQtMmgtMnYySDExdi0yeiIvPjwvc3ZnPg==',
        exec: (editor: any) => {
          editor.s.insertHTML(layoutTemplates.imageLeftTextRight());
          message.success('Image-left layout inserted');
        }
      },
      {
        name: 'insertTextLeftImage',
        tooltip: 'Text Left, Image Right',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTkgMTBoNnY0SDl2LTR6bTQgMmgydjJIMTN2LTJ6bTQgMGg2djRIMTd2LTR6bTQgMmgydjJIMjF2LTJ6TTMgNGgxOHYxNkgzVjR6TTE1IDEySDR2NGgxMXYtNHptMC0yVjZINGgxMXY0eiIvPjwvc3ZnPg==',
        exec: (editor: any) => {
          editor.s.insertHTML(layoutTemplates.textLeftImageRight());
          message.success('Text-left layout inserted');
        }
      },
      {
        name: 'insertImageGrid',
        tooltip: '2x2 Image Grid',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTQgNHY2aDZWNEg0em0yIDRoMlY2SDZ2MnptNi0ydjZoNlY0aC02em0yIDRoMlY2aC0ydjJ6TTQgMTR2Nmg2di02SDR6bTIgNGgydi0ySDZ2MnptNiAwaDZ2LTZoLTZ2NnptMi00aDJ2MmgtMnYtMnoiLz48L3N2Zz4=',
        exec: (editor: any) => {
          editor.s.insertHTML(layoutTemplates.imageGrid2x2());
          message.success('2x2 grid layout inserted');
        }
      },
      {
        name: 'insertFeatureCards',
        tooltip: 'Feature Cards',
        iconURL: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTQgNmgtMXYxMmgxOGYtMlY2SDR6bTAgMTBoMTJWOEg0djh6Ii8+PC9zdmc+',
        exec: (editor: any) => {
          editor.s.insertHTML(layoutTemplates.featureCard());
          message.success('Feature cards inserted');
        }
      }
    ]
  }), [disabled, height, placeholder, uploadEndpoint]);

  const insertLayout = (layoutKey: keyof typeof layoutTemplates) => {
    if (editorRef.current) {
      editorRef.current.s.insertHTML(layoutTemplates[layoutKey]());
      setShowLayoutModal(false);
      message.success('Layout inserted successfully');
    }
  };

  return (
    <div className="relative">
      {/* Layout Selection Modal */}
      <Modal
        title="Choose a Layout Template"
        open={showLayoutModal}
        onCancel={() => setShowLayoutModal(false)}
        width={800}
        footer={null}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className="border rounded-xl p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
              onClick={() => insertLayout('threeImagesHorizontal')}
            >
              <div className="flex items-center mb-3">
                <GifOutlined className="text-blue-600 text-lg mr-2" />
                <h4 className="font-semibold">3 Images Horizontal</h4>
              </div>
              <div className="flex space-x-2 mb-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-1/3 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded"></div>
                ))}
              </div>
              <p className="text-sm text-gray-600">Perfect for showcasing multiple products or features side by side</p>
            </div>
            
            <div 
              className="border rounded-xl p-4 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all"
              onClick={() => insertLayout('imageLeftTextRight')}
            >
              <div className="flex items-center mb-3">
                <AlignLeftOutlined className="text-purple-600 text-lg mr-2" />
                <h4 className="font-semibold">Image Left, Text Right</h4>
              </div>
              <div className="flex space-x-2">
                <div className="w-2/5 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded"></div>
                <div className="w-3/5 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded"></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Visual-first layout for strong image impact</p>
            </div>
            
            <div 
              className="border rounded-xl p-4 hover:border-green-400 hover:shadow-md cursor-pointer transition-all"
              onClick={() => insertLayout('textLeftImageRight')}
            >
              <div className="flex items-center mb-3">
                <AlignRightOutlined className="text-green-600 text-lg mr-2" />
                <h4 className="font-semibold">Text Left, Image Right</h4>
              </div>
              <div className="flex space-x-2">
                <div className="w-3/5 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded"></div>
                <div className="w-2/5 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded"></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Content-first layout for detailed explanations</p>
            </div>
            
            <div 
              className="border rounded-xl p-4 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all"
              onClick={() => insertLayout('imageGrid2x2')}
            >
              <div className="flex items-center mb-3">
                <ColumnWidthOutlined className="text-amber-600 text-lg mr-2" />
                <h4 className="font-semibold">2x2 Image Grid</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 rounded"></div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">Gallery layout for multiple image showcases</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Quick Features</h4>
            <div 
              className="border rounded-xl p-4 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all"
              onClick={() => insertLayout('featureCard')}
            >
              <div className="flex items-center mb-2">
                <IeOutlined className="text-indigo-600 text-lg mr-2" />
                <h4 className="font-semibold">Feature Cards (3-column)</h4>
              </div>
              <p className="text-sm text-gray-600">Perfect for highlighting key features or benefits in a beautiful card layout</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Custom Toolbar Extension */}
      <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <Space>
          <Upload 
            showUploadList={false}
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                const url = await handleImageUpload(file as File);
                if (onSuccess) onSuccess({ url });
                
                if (editorRef.current) {
                  editorRef.current.s.insertImage(url, null, 350);
                }
              } catch (error) {
                if (onError) onError(error as Error);
              }
            }}
          >
            <Button 
              type="default" 
              icon={<PictureOutlined />}
              loading={isUploading}
              className="flex items-center gap-2"
            >
              Upload Image
            </Button>
          </Upload>
          
          <Button 
            type="primary"
            icon={<LayoutOutlined />}
            onClick={() => setShowLayoutModal(true)}
            className="flex items-center gap-2"
          >
            Layout Templates
          </Button>
          
          <Button 
            type="default" 
            icon={<GifOutlined />}
            onClick={() => insertLayout('threeImagesHorizontal')}
          >
            3 Images
          </Button>
          
          <Button 
            type="default" 
            icon={<AlignLeftOutlined />}
            onClick={() => insertLayout('imageLeftTextRight')}
          >
            Image Left
          </Button>
          
          <Button 
            type="default" 
            icon={<AlignRightOutlined />}
            onClick={() => insertLayout('textLeftImageRight')}
          >
            Text Left
          </Button>
        </Space>
      </div>
      
      {/* Jodit Editor */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <JoditEditor
          ref={editorRef}
          value={value}
          config={config}
          onBlur={(newContent: string) => onChange(newContent)}
          onChange={onChange}
        />
      </div>
      
      {/* Add custom CSS for advanced animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        
        /* Enhanced Jodit styling */
        .jodit-wysiwyg {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 2rem !important;
          min-height: ${height}px;
          background: linear-gradient(to bottom, #ffffff, #fafafa);
        }
        
        /* Make layout templates responsive */
        .jodit-wysiwyg .grid {
          display: grid !important;
        }
        
        .jodit-wysiwyg .flex {
          display: flex !important;
        }
        
        .jodit-wysiwyg .hidden {
          display: none !important;
        }
        
        @media (max-width: 768px) {
          .jodit-wysiwyg .md\\:flex-row {
            flex-direction: column !important;
          }
          
          .jodit-wysiwyg .md\\:w-2\\/5,
          .jodit-wysiwyg .md\\:w-3\\/5 {
            width: 100% !important;
          }
          
          .jodit-wysiwyg .md\\:grid-cols-2,
          .jodit-wysiwyg .md\\:grid-cols-3 {
            grid-template-columns: 1fr !important;
          }
        }
        
        /* Custom placeholder styling */
        .jodit-wysiwyg [placeholder]:empty:before {
          content: attr(placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        
        /* Smooth transitions for all elements */
        .jodit-wysiwyg * {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
        
        /* Custom toolbar with glass effect */
        .jodit-toolbar__box {
          background: linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.95) 100%) !important;
          backdrop-filter: blur(10px) !important;
          border-bottom: 1px solid rgba(229, 231, 235, 0.5) !important;
          padding: 0.75rem !important;
        }
        
        .jodit-toolbar-button {
          border-radius: 0.75rem !important;
          padding: 0.5rem 0.75rem !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: 1px solid transparent !important;
        }
        
        .jodit-toolbar-button:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          color: white !important;
          transform: translateY(-2px) scale(1.05) !important;
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.3) !important;
          border-color: transparent !important;
        }
        
        .jodit-toolbar-button_active {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          color: white !important;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default JoditWrapper;