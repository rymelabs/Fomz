import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  ChevronRight, 
  FileText, 
  Star, 
  Trash2, 
  Briefcase, 
  MessageSquare, 
  Users, 
  Calendar, 
  GraduationCap, 
  Layout, 
  Check,
  Phone,
  FileQuestion,
  ChevronLeft
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { 
  getAllTemplates, 
  TEMPLATE_CATEGORIES, 
  deleteTemplate,
  applyTemplate 
} from '../../services/templateService';
import { useUserStore } from '../../store/userStore';
import { useThemeStore } from '../../store/themeStore';

// Map string keys to Lucide icons
const ICON_MAP = {
  'phone': Phone,
  'star': Star,
  'briefcase': Briefcase,
  'calendar': Calendar,
  'file-question': FileQuestion,
  'file-text': FileText,
  'layout': Layout,
  'message-square': MessageSquare,
  'users': Users,
  'graduation-cap': GraduationCap,
  'check': Check
};

// Map category IDs to icons (fallback)
const CATEGORY_ICONS = {
  'all': Layout,
  'business': Briefcase,
  'feedback': MessageSquare,
  'hr': Users,
  'events': Calendar,
  'education': GraduationCap,
  'custom': Star
};

// Helper to generate colored shadow
const getThemeShadow = (hexColor) => {
  if (!hexColor) return '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
  
  // Basic hex to rgb conversion
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  return `0 10px 25px -5px rgba(${r}, ${g}, ${b}, 0.25), 0 8px 10px -6px rgba(${r}, ${g}, ${b}, 0.1)`;
};

const TemplateSelectorModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const { user } = useUserStore();
  const themes = useThemeStore((state) => state.themes);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setPreviewTemplate(null);
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen, user?.uid]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const allTemplates = await getAllTemplates(user?.uid);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    const formData = applyTemplate(template);
    onSelectTemplate(formData);
    onClose();
  };

  const handleDeleteTemplate = async (e, templateId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteTemplate(templateId, user?.uid);
      setTemplates(templates.filter(t => t.id !== templateId));
      if (previewTemplate?.id === templateId) {
        setPreviewTemplate(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl"
      title="Choose a Template"
      description="Start with a pre-built form or create your own"
      noPadding
    >
      <div className="flex flex-col h-[75vh] bg-gray-50/50">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Categories */}
          <div className="w-64 bg-white border-r border-gray-100 p-4 overflow-y-auto hidden md:block">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Categories</h3>
            <div className="space-y-1">
              {TEMPLATE_CATEGORIES.map((category) => {
                const count = category.id === 'all' 
                  ? templates.length 
                  : templates.filter(t => t.category === category.id).length;
                
                const Icon = ICON_MAP[category.icon] || CATEGORY_ICONS[category.id] || FileText;
                const isSelected = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-medium shadow-sm ring-1 ring-primary-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span>{category.name}</span>
                    </span>
                    {count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-white text-primary-600' 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
            {/* Search */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No templates found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${previewTemplate ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 transition-all duration-300`}>
                  {/* Start Blank Option */}
                  {selectedCategory === 'all' && !searchQuery && (
                    <div
                      onClick={() => {
                        onSelectTemplate(null);
                        onClose();
                      }}
                      className={`group relative bg-white border border-gray-200 border-dashed rounded-xl cursor-pointer hover:border-primary-500 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center ${
                        previewTemplate ? 'p-3 h-[140px]' : 'p-5 h-[200px]'
                      }`}
                    >
                      <div className={`${previewTemplate ? 'w-10 h-10 mb-2' : 'w-12 h-12 mb-3'} bg-primary-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Layout className={`${previewTemplate ? 'h-5 w-5' : 'h-6 w-6'} text-primary-600`} />
                      </div>
                      <h3 className={`font-semibold text-gray-900 ${previewTemplate ? 'text-xs mb-0.5' : 'mb-1'}`}>Start from Scratch</h3>
                      <p className={`text-xs text-gray-500 ${previewTemplate ? 'px-1 line-clamp-1' : 'px-4'}`}>Create a new blank form with no pre-defined questions</p>
                    </div>
                  )}

                  {filteredTemplates.map((template) => {
                    const TemplateIcon = ICON_MAP[template.icon] || CATEGORY_ICONS[template.category] || FileText;
                    const themeId = template.form?.theme || 'blue';
                    const themeEntry = themes[themeId];
                    const gradient = themeEntry?.gradient || 'bg-gray-100';
                    const isCompact = !!previewTemplate;
                    const shadowStyle = getThemeShadow(themeEntry?.primaryColor);

                    return (
                      <div
                        key={template.id}
                        onClick={() => setPreviewTemplate(template)}
                        style={{ 
                          borderColor: themeEntry?.primaryColor,
                          '--theme-shadow': shadowStyle 
                        }}
                        className={`group relative bg-white border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-[var(--theme-shadow)] flex flex-col ${
                          isCompact ? 'p-3 h-[140px]' : 'p-5 h-[200px]'
                        } ${
                          previewTemplate?.id === template.id 
                            ? 'ring-1 shadow-md' 
                            : 'hover:border-opacity-100 border-opacity-40'
                        }`}
                      >
                        <div className={`flex items-start justify-between ${isCompact ? 'mb-2' : 'mb-4'}`}>
                          <div className={`${isCompact ? 'w-8 h-8 rounded-md' : 'w-10 h-10 rounded-lg'} flex items-center justify-center transition-colors`} style={{ backgroundColor: `${themeEntry?.primaryColor}20`, color: themeEntry?.primaryColor }}>
                            {/* Use icon based on category instead of emoji from data if possible, or fallback */}
                            <TemplateIcon className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {/* Theme Preview Dot */}
                             {themeEntry && (
                                <div 
                                  className="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/5" 
                                  style={{ background: themeEntry.gradient }}
                                  title={`Theme: ${themeEntry.name}`}
                                />
                             )}

                            {template.isBuiltIn && (
                              <div className="bg-amber-50 rounded-full p-1" title="Official Template">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              </div>
                            )}
                            {!template.isBuiltIn && (
                              <button
                                onClick={(e) => handleDeleteTemplate(e, template.id)}
                                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Template"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isCompact ? 'text-xs mb-1' : 'text-sm mb-1.5'} line-clamp-1 ${
                            previewTemplate?.id === template.id ? 'text-primary-700' : 'text-gray-900'
                          }`}>
                            {template.name}
                          </h3>
                          <p className={`text-xs text-gray-500 leading-relaxed ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}>
                            {template.description}
                          </p>
                        </div>
                        
                        <div className={`flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 ${isCompact ? 'mt-2 pt-2' : 'mt-4 pt-3'}`}>
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            {template.form.questions.length} Qs
                          </span>
                          {previewTemplate?.id === template.id && !isCompact && (
                            <span className="text-primary-600 font-medium flex items-center gap-1">
                              View Details <ChevronRight className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel - Slide over on mobile, stick right on desktop */}
          {previewTemplate && (
            <div className="w-[350px] bg-white border-l border-gray-100 flex flex-col shadow-xl animate-slide-in-right z-10">
              {(() => {
                const themeId = previewTemplate.form?.theme || 'blue';
                const themeEntry = themes[themeId];
                
                return (
                  <div 
                    className="p-6 border-b border-gray-100 bg-gray-50/30 relative"
                    style={{ borderTop: `4px solid ${themeEntry?.primaryColor || '#4f46e5'}` }}
                  >
                     <button 
                      onClick={() => setPreviewTemplate(null)}
                      className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-colors mb-2"
                      title="Back to options"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                     <div 
                      className="w-12 h-12 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center mb-4"
                      style={{ color: themeEntry?.primaryColor }}
                    >
                      {(() => {
                        const PreviewIcon = ICON_MAP[previewTemplate.icon] || CATEGORY_ICONS[previewTemplate.category] || FileText;
                        return <PreviewIcon className="h-6 w-6" />;
                      })()}
                    </div>
                    <h3 className="font-display font-bold text-gray-900 text-lg mb-1">{previewTemplate.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed pr-8">{previewTemplate.description}</p>
                  </div>
                );
              })()}
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Preview Form</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {previewTemplate.form.questions.length} questions
                  </span>
                </div>
                
                <div className="space-y-3 relative">
                  {/* Timeline connecting line */}
                  <div className="absolute left-3.5 top-2 bottom-4 w-px bg-gray-200"></div>

                  {previewTemplate.form.questions.map((q, idx) => (
                    <div key={q.id} className="relative pl-10 py-1 group">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-500 group-hover:border-primary-400 group-hover:text-primary-600 transition-colors shadow-sm">
                        {idx + 1}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border border-transparent group-hover:border-gray-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.title}</p>
                          {q.required && (
                            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Required</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 capitalize font-medium flex items-center gap-1.5">
                          {(() => {
                             // Minimal icons for types
                             return <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                          })()}
                          {q.type.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <Button
                  onClick={() => handleSelectTemplate(previewTemplate)}
                  className="w-full justify-center shadow-sm"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TemplateSelectorModal;
