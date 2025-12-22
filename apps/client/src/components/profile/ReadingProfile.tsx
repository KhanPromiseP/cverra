import { useState } from "react";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from "@reactive-resume/ui";
import { Pencil, Check, X } from "@phosphor-icons/react";

interface ReadingProfileProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export function ReadingProfile({ profile, onUpdate }: ReadingProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState(profile || {});

  const readingLevels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
  ];

  const timeOptions = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '60+ min' },
  ];

  const handleSave = () => {
    onUpdate(editableProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableProfile(profile);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reading Profile</CardTitle>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="mr-2 text-blue-500">
            <Pencil size={16} className="mr-2 text-blue-500" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X size={16} />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check size={16} />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preferred Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Favorite Categories
          </h4>
          <div className="flex flex-wrap gap-2">
            {editableProfile.preferredCategories?.map((cat: string) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Reading Level */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reading Level
          </h4>
          {isEditing ? (
            <div className="flex gap-2">
              {readingLevels.map(level => (
                <Button
                  key={level.value}
                  variant={editableProfile.readingLevel === level.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setEditableProfile({...editableProfile, readingLevel: level.value})}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          ) : (
            <Badge variant="outline">
              {editableProfile.readingLevel || 'Not set'}
            </Badge>
          )}
        </div>

        {/* Preferred Reading Time */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preferred Reading Time
          </h4>
          {isEditing ? (
            <div className="flex gap-2">
              {timeOptions.map(time => (
                <Button
                  key={time.value}
                  variant={editableProfile.preferredReadingTime === time.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setEditableProfile({...editableProfile, preferredReadingTime: time.value})}
                >
                  {time.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-gray-900 dark:text-white">
              {editableProfile.preferredReadingTime ? `${editableProfile.preferredReadingTime} minutes` : 'Not set'}
            </div>
          )}
        </div>

        {/* Interests */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Interests
          </h4>
          <div className="flex flex-wrap gap-2">
            {editableProfile.interests?.map((interest: string) => (
              <Badge key={interest} variant="outline">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}