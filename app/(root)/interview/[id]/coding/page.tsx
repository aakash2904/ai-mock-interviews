"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CodeEditor from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/actions/auth.action";

export default function CodingRound() {
  const { id: interviewId } = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [code, setCode] = useState<string>("// Write your code here");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      setUserId(user?.id || null);
      
      try {
        const response = await fetch("/api/coding/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate_question", interviewId, userId: user?.id })
        });
        const data = await response.json();
        
        if (data.success) {
          setQuestion(data.question);
        } else {
          toast.error("Failed to load question");
        }
      } catch (e) {
        toast.error("Error loading challenge");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [interviewId]);

  const handleSubmit = async () => {
    if (!code || code === "// Write your code here") {
      toast.error("Please write some code before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/coding/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evaluate_code", interviewId, userId, code })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Code evaluated successfully!");
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        toast.error("Evaluation failed.");
      }
    } catch (e) {
      toast.error("Error submitting code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Technical Coding Challenge</h1>
        <p className="text-muted-foreground">Complete this problem in the browser. When you are done, click submit to get your final feedback.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin text-primary-200" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-[600px]">
          {/* Question View */}
          <div className="bg-dark-200 rounded-lg p-6 overflow-y-auto h-full markdown-body text-white">
            <h3 className="font-semibold text-xl mb-4 border-b border-dark-100 pb-2">Problem Description</h3>
            <div className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
              {question}
            </div>
          </div>

          {/* Editor View */}
          <div className="flex flex-col h-full gap-4">
            <div className="flex-1 overflow-hidden min-h-0 bg-[#1e1e1e] rounded-lg border border-dark-100">
              <CodeEditor 
                height="100%" 
                defaultValue={code} 
                onChange={(val) => setCode(val || "")} 
                language="javascript" 
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary w-40">
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Evaluating...</span>
                ) : (
                  "Submit Code"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
