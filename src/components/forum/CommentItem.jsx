import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, User, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function CommentItem({ comment, postAuthor }) {
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: () => base44.entities.ForumComment.update(comment.id, {
      ...comment,
      upvotes: (comment.upvotes || 0) + 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments'] });
    },
  });

  const isAuthorComment = comment.created_by === postAuthor;

  return (
    <Card className={`${isAuthorComment ? 'border-l-4 border-l-green-500 bg-green-50/30' : 'border-gray-200'}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">
                {comment.author_name || comment.created_by}
              </span>
              {isAuthorComment && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                  Post Author
                </Badge>
              )}
              {comment.is_solution && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Solution
                </Badge>
              )}
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(comment.created_date), "MMM d, yyyy")}
              </span>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap mb-3">{comment.content}</p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => upvoteMutation.mutate()}
              className="flex items-center gap-2 h-8 px-2"
            >
              <ThumbsUp className="w-3 h-3" />
              <span className="text-xs">{comment.upvotes || 0}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}