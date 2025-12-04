import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Clock, 
  BarChart3, 
  Wrench, 
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

export default function GuideDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const guideId = urlParams.get('id');

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', guideId],
    queryFn: async () => {
      const guides = await base44.entities.Guide.list();
      return guides.find(g => g.id === guideId);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded w-3/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Guide not found</h2>
          <Button onClick={() => navigate(createPageUrl("Guides"))}>
            Back to Guides
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl("Guides"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Guides
        </Button>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800">
              {guide.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            {guide.difficulty && (
              <Badge variant="outline">{guide.difficulty}</Badge>
            )}
            {guide.season?.map(s => (
              <Badge key={s} variant="outline" className="capitalize">{s}</Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            {guide.title}
          </h1>
          
          <p className="text-xl text-gray-600">{guide.description}</p>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            {guide.time_estimate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{guide.time_estimate}</span>
              </div>
            )}
            {guide.difficulty && (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="capitalize">{guide.difficulty} Level</span>
              </div>
            )}
          </div>
        </div>

        {/* Tools Needed */}
        {guide.tools_needed && guide.tools_needed.length > 0 && (
          <Card className="border-none shadow-lg bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Wrench className="w-5 h-5" />
                Tools & Materials Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-2">
                {guide.tools_needed.map((tool, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-blue-800">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        {guide.steps && guide.steps.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Step-by-Step Instructions</h2>
            {guide.steps.map((step, idx) => (
              <Card key={idx} className="border-l-4 border-l-green-600 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      {step.step_number || idx + 1}
                    </div>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{step.description}</p>
                  
                  {step.tips && step.tips.length > 0 && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-900 mb-2">Tips:</p>
                          <ul className="space-y-1 text-amber-800">
                            {step.tips.map((tip, tipIdx) => (
                              <li key={tipIdx}>• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Content */}
        {guide.content && (
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 prose prose-green max-w-none">
              <ReactMarkdown>{guide.content}</ReactMarkdown>
            </CardContent>
          </Card>
        )}

        {/* Quick Tips */}
        {guide.tips && guide.tips.length > 0 && (
          <Card className="border-none shadow-lg bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Lightbulb className="w-5 h-5" />
                Quick Tips & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guide.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-green-800">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-1" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}