import React, { useState } from 'react';
import { Send, Copy, Check, Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SharedText } from '@/hooks/useTextSharing';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TextShareProps {
  texts: SharedText[];
  loading?: boolean;
  onAdd: (content: string) => Promise<void>;
  onRemove: (textId: string) => void;
  onClearAll: () => void;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TextShare: React.FC<TextShareProps> = ({ texts, loading, onAdd, onRemove, onClearAll }) => {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || saving) return;
    
    setSaving(true);
    try {
      await onAdd(input);
      setInput('');
      toast({
        title: "Text saved",
        description: "Your text is now shared in the room",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save text",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (text: SharedText) => {
    await navigator.clipboard.writeText(text.content);
    setCopiedId(text.id);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste text to share..."
          className="min-h-[100px] bg-secondary/50 border-border/50 focus:border-primary/50 resize-none font-mono text-sm"
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!input.trim() || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Save & Share
          </Button>
        </div>
      </form>

      {/* Saved Texts List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Saved Texts ({texts.length})
          </h3>
          {texts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-muted-foreground hover:text-destructive h-7 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm">Loading texts...</p>
          </div>
        ) : texts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No texts saved yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {texts.map((text, index) => (
              <div
                key={text.id}
                className={cn(
                  "group p-3 rounded-lg bg-secondary/50 border border-border/50",
                  "hover:bg-secondary hover:border-primary/30 transition-all duration-200",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-sm text-foreground whitespace-pre-wrap break-all flex-1 line-clamp-3">
                    {text.content}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(text)}
                      className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      {copiedId === text.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(text.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatTime(text.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextShare;
