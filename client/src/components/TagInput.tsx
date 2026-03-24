import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  value: string;
  onChange: (tags: string) => void;
  suggestions?: string[];
}

export function TagInput({ value, onChange, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  
  const tags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
  
  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      onChange(newTags.join(", "));
      setInputValue("");
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    onChange(newTags.join(", "));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:bg-slate-700 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tags (press Enter or comma)"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addTag(inputValue)}
          disabled={!inputValue.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-500">Suggestions:</span>
          {suggestions.filter(s => !tags.includes(s)).map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-pointer hover:bg-slate-700"
              onClick={() => addTag(suggestion)}
            >
              + {suggestion}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
