import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  MessageCircle, 
  Eye, 
  User,
  Calendar,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

const postTypeIcons = {
  question: HelpCircle,
  experience: MessageCircle,
  tip: Lightbulb,
  discussion: MessageSquare
};

const postTypeColors = {
  question: "bg-blue-100 text-blue-700 border-blue-200",
  experience: "bg-green-100 text-green-700 border-green-200",
  tip: "bg-yellow-100 text-yellow-700 border-yellow-200",
  discussion: "bg-purple-100 text-purple-700 border-purple-200"
};

export default function ForumPostCard({ post, commentCount, onClick }) {
  const Icon = postTypeIcons[post.post_type];

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-green-500 bg-white/80 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${postTypeColors[post.post_type]?.replace('text-', 'bg-').replace('700', '200')}`}>
            <Icon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={postTypeColors[post.post_type]}>
                {post.post_type}
              </Badge>
              <Badge variant="outline" className="capitalize text-xs">
                {post.category.replace(/_/g, ' ')}
              </Badge>
              {post.is_resolved && (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-green-700 transition-colors line-clamp-2">
              {post.title}
            </h3>

            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {post.content.substring(0, 150)}...
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs text-gray-600">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{post.author_name || post.created_by}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(post.created_date), "MMM d")}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>{post.upvotes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{commentCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{post.view_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}