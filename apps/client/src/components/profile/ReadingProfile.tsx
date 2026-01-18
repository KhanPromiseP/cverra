
import { useState, useEffect } from "react";
import { t, Trans } from "@lingui/macro";
import { 
  Button, 
  Badge, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input,
  Checkbox
} from "@reactive-resume/ui";
import { Pencil, Check, X, Plus, Tag, BookOpen, Sparkle } from "@phosphor-icons/react";

// Define proper interfaces
export interface DatabaseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  articleCount?: number;
}

export interface ReadingProfileData {
  preferredCategories?: string[];
  readingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  preferredReadingTime?: number; // Session duration in minutes
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'; // Optional
  interests?: string[];
  // Optional notification preferences
  notifyNewArticles?: boolean;
  notifyTrending?: boolean;
  notifyPersonalized?: boolean;
  digestFrequency?: 'daily' | 'weekly' | 'none';
}

export interface ReadingProfileProps {
  profile: ReadingProfileData | null;
  onUpdate: (data: ReadingProfileData) => Promise<void> | void;
  isLoading?: boolean;
  categories?: DatabaseCategory[];
  isLoadingCategories?: boolean;
}

// Define types for dropdown options
interface ReadingLevelOption {
  value: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  label: string;
  description: string;
}

interface TimeOption {
  value: number;
  label: string;
  description?: string;
}

// Optional: Time of day options (if you want to add this later)
interface TimeOfDayOption {
  value: 'morning' | 'afternoon' | 'evening' | 'anytime';
  label: string;
  icon: string;
}

export function ReadingProfile({ 
  profile, 
  onUpdate, 
  isLoading = false,
  categories = [],
  isLoadingCategories = false 
}: ReadingProfileProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableProfile, setEditableProfile] = useState<ReadingProfileData>(profile || {});
  const [newInterest, setNewInterest] = useState<string>("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Initialize selected categories from profile
  useEffect(() => {
    if (profile && profile.preferredCategories && categories.length > 0) {
      const categoryIds = profile.preferredCategories.map(cat => {
        const category = categories.find(c => c.name === cat || c.id === cat);
        return category?.id || cat;
      }).filter(id => id); // Filter out undefined
      setSelectedCategoryIds(categoryIds);
    }
  }, [profile, categories]);

  // Update local state when profile changes
  useEffect(() => {
    setEditableProfile(profile || {});
  }, [profile]);

  const readingLevels: ReadingLevelOption[] = [
    { value: 'BEGINNER', label: t`Beginner`, description: t`New to topic, learning basics` },
    { value: 'INTERMEDIATE', label: t`Intermediate`, description: t`Some experience, expanding knowledge` },
    { value: 'ADVANCED', label: t`Advanced`, description: t`Deep understanding, staying current` },
    { value: 'EXPERT', label: t`Expert`, description: t`Industry professional, thought leadership` },
  ];

  const timeOptions: TimeOption[] = [
    { value: 5, label: t`5 min`, description: t`Quick reads` },
    { value: 10, label: t`10 min`, description: t`Short articles` },
    { value: 15, label: t`15 min`, description: t`Standard articles` },
    { value: 20, label: t`20 min`, description: t`In-depth pieces` },
    { value: 30, label: t`30 min`, description: t`Detailed analysis` },
    { value: 45, label: t`45 min`, description: t`Comprehensive guides` },
    { value: 60, label: t`60+ min`, description: t`Deep dives` },
  ];

  // Optional: Time of day options
  const timeOfDayOptions: TimeOfDayOption[] = [
    { value: 'morning', label: t`Morning`, icon: '🌅' },
    { value: 'afternoon', label: t`Afternoon`, icon: '☀️' },
    { value: 'evening', label: t`Evening`, icon: '🌆' },
    { value: 'anytime', label: t`Anytime`, icon: '⏰' },
  ];

  const handleSave = async () => {
    try {
      // Convert selected category IDs back to names for API
      const selectedCategories = selectedCategoryIds.map(catId => {
        const category = categories.find(c => c.id === catId);
        return category?.name || catId;
      });

      const profileToSave: ReadingProfileData = {
        ...editableProfile,
        preferredCategories: selectedCategories,
      };

      console.log('Saving profile:', profileToSave);
      await onUpdate(profileToSave);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // You might want to show an error toast here
    }
  };

  const handleCancel = () => {
    setEditableProfile(profile || {});
    
    // Reset selected categories
    if (profile && profile.preferredCategories && categories.length > 0) {
      const categoryIds = profile.preferredCategories.map(cat => {
        const category = categories.find(c => c.name === cat || c.id === cat);
        return category?.id || cat;
      }).filter(id => id);
      setSelectedCategoryIds(categoryIds);
    } else {
      setSelectedCategoryIds([]);
    }
    
    setIsEditing(false);
    setNewInterest("");
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const addInterest = () => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest && !editableProfile.interests?.includes(trimmedInterest)) {
      const currentInterests = editableProfile.interests || [];
      setEditableProfile({
        ...editableProfile,
        interests: [...currentInterests, trimmedInterest]
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove: string) => {
    const currentInterests = editableProfile.interests || [];
    setEditableProfile({
      ...editableProfile,
      interests: currentInterests.filter(interest => interest !== interestToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  // Get selected category names for display
  const getSelectedCategoryNames = () => {
    return selectedCategoryIds.map(catId => {
      const category = categories.find(c => c.id === catId);
      return category?.name || catId;
    });
  };

  // Format reading time display
  const formatReadingTime = (time?: number) => {
    if (!time) return t`Not set`;
    return t`{time, plural, one {# minute} other {# minutes}}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <Trans>Reading Profile</Trans>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <Trans>Reading Profile</Trans>
          {isEditing && (
            <Badge variant="outline" className="ml-2">
              <Sparkle className="h-3 w-3 mr-1" />
              <Trans>Editing</Trans>
            </Badge>
          )}
        </CardTitle>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="gap-1"
          >
            <Pencil size={16} />
            <Trans>Edit Preferences</Trans>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1">
              <X size={16} />
              <Trans>Cancel</Trans>
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Check size={16} />
              <Trans>Save Changes</Trans>
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preferred Categories from Database */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <Trans>Favorite Categories</Trans>
            </h4>
            {isEditing && selectedCategoryIds.length > 0 && (
              <span className="text-xs text-gray-500">
                <Trans>{selectedCategoryIds.length} selected</Trans>
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              {isLoadingCategories ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : categories.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {categories
                    .filter(cat => cat.isActive)
                    .map((category: DatabaseCategory) => {
                      const isSelected = selectedCategoryIds.includes(category.id);
                      return (
                        <div 
                          key={category.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                          onClick={() => toggleCategory(category.id)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleCategory(category.id)}
                            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {category.icon && (
                                <span className="text-sm">{category.icon}</span>
                              )}
                              <span className={`font-medium ${
                                isSelected 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {category.name}
                              </span>
                              {category.articleCount !== undefined && (
                                <Badge variant="outline" size="sm" className="ml-auto">
                                  {category.articleCount}
                                </Badge>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    <Trans>No categories available</Trans>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <Trans>Contact admin to add categories</Trans>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {selectedCategoryIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {getSelectedCategoryNames().map((categoryName: string, index: number) => {
                    const category = categories.find(c => c.name === categoryName || c.id === selectedCategoryIds[index]);
                    return (
                      <Badge 
                        key={category?.id || categoryName}
                        variant="secondary"
                        className="gap-1"
                        style={category?.color ? { 
                          backgroundColor: category.color + '20',
                          color: category.color,
                          borderColor: category.color + '40'
                        } : {}}
                      >
                        {category?.icon && <span>{category.icon}</span>}
                        {categoryName}
                        {category?.articleCount !== undefined && (
                          <span className="ml-1 text-xs opacity-75">
                            ({category.articleCount})
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    <Trans>No favorite categories selected</Trans>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <Trans>Click edit to select categories that interest you</Trans>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Reading Level */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Trans>Reading Level</Trans>
          </h4>
          {isEditing ? (
            <div className="space-y-2">
              {readingLevels.map((level: ReadingLevelOption) => {
                const isSelected = editableProfile.readingLevel === level.value;
                return (
                  <div 
                    key={level.value}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setEditableProfile({
                      ...editableProfile, 
                      readingLevel: level.value
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        isSelected 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {level.label}
                      </span>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {level.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {editableProfile.readingLevel ? (
                <>
                  <Badge variant="outline" className="px-3 py-1.5">
                    {editableProfile.readingLevel}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {readingLevels.find(l => l.value === editableProfile.readingLevel)?.description}
                  </p>
                </>
              ) : (
                <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg w-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    <Trans>Reading level not set</Trans>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <Trans>Click edit to set your reading level</Trans>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preferred Reading Time (Session Duration) */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Trans>Preferred Reading Session Duration</Trans>
          </h4>
          {isEditing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {timeOptions.map((time: TimeOption) => (
                <div key={time.value} className="flex flex-col">
                  <Button
                    variant={editableProfile.preferredReadingTime === time.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setEditableProfile({
                      ...editableProfile, 
                      preferredReadingTime: time.value
                    })}
                    className="flex-1"
                  >
                    {time.label}
                  </Button>
                  {time.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      {time.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {editableProfile.preferredReadingTime ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {editableProfile.preferredReadingTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatReadingTime(editableProfile.preferredReadingTime)}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {timeOptions.find(t => t.value === editableProfile.preferredReadingTime)?.description || t`per session`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg w-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    <Trans>Session duration not set</Trans>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <Trans>Click edit to set your preferred reading time</Trans>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <Trans>Personal Interests</Trans>
            </h4>
            {isEditing && editableProfile.interests && editableProfile.interests.length > 0 && (
              <span className="text-xs text-gray-500">
                <Trans>{editableProfile.interests.length} interests</Trans>
              </span>
            )}
          </div>
          
          {isEditing ? (
            <>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder={t`Add an interest (e.g., AI, Fintech, Healthcare)`}
                  value={newInterest}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setNewInterest(e.target.value)
                  }
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={addInterest}
                  disabled={!newInterest.trim()}
                  variant={"outline"}
                >
                  <Plus size={16} />
                  <Trans>Add</Trans>
                </Button>
              </div>
              
              {editableProfile.interests && editableProfile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {editableProfile.interests.map((interest: string) => (
                    <Badge 
                      key={interest} 
                      variant="outline"
                      className="group cursor-pointer px-3 py-1.5"
                      onClick={() => removeInterest(interest)}
                    >
                      <Tag size={12} className="mr-1.5" />
                      {interest}
                      <X size={10} className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    <Trans>No interests added yet</Trans>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <Trans>Add topics you're passionate about</Trans>
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {editableProfile.interests && editableProfile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {editableProfile.interests.map((interest: string) => (
                    <Badge key={interest} variant="outline" className="gap-1 px-3 py-1.5">
                      <Tag size={12} />
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    <Trans>No interests added yet</Trans>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <Trans>Click edit to add your interests</Trans>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Optional: Time of Day Preference (Uncomment if you want to add this) */}
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Trans>Preferred Time of Day</Trans>
          </h4>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {timeOfDayOptions.map((time: TimeOfDayOption) => (
                <Button
                  key={time.value}
                  variant={editableProfile.preferredTimeOfDay === time.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setEditableProfile({
                    ...editableProfile, 
                    preferredTimeOfDay: time.value
                  })}
                  className="gap-1"
                >
                  <span>{time.icon}</span>
                  {time.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {editableProfile.preferredTimeOfDay ? (
                <Badge variant="outline" className="gap-1 px-3 py-1.5">
                  <span>{timeOfDayOptions.find(t => t.value === editableProfile.preferredTimeOfDay)?.icon}</span>
                  {editableProfile.preferredTimeOfDay.charAt(0).toUpperCase() + editableProfile.preferredTimeOfDay.slice(1)}
                </Badge>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  <Trans>Not set</Trans>
                </p>
              )}
            </div>
          )}
        </div>
       
      </CardContent>
    </Card>
  );
}