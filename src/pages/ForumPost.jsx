import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  ThumbsUp, 
  MessageCircle, 
  Eye,
  Calendar,
  User,
  CheckCircle2,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

import CommentItem from "../components/forum/CommentItem";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

const postTypeColors = {
  question: "bg-blue-100 text-blue-700 border-blue-200",
  experience: "bg-green-100 text-green-700 border-green-200",
  tip: "bg-yellow-100 text-yellow-700 border-yellow-200",
  discussion: "bg-purple-100 text-purple-700 border-purple-200"
};

export default function ForumPost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log("User not logged in");
      }
    };
    fetchUser();
  }, []);

  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ['forum-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const posts = await base44.entities.ForumPost.list();
      const foundPost = posts.find(p => p.id === postId);
      
      if (foundPost) {
        await base44.entities.ForumPost.update(postId, {
          ...foundPost,
          view_count: (foundPost.view_count || 0) + 1
        });
      }
      
      return foundPost ?? null;
    },
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const allComments = await base44.entities.ForumComment.list('-created_date');
      return allComments.filter(c => c.post_id === postId);
    },
  });

  const upvotePostMutation = useMutation({
    mutationFn: () => {
      if (!subscriptionData.isPro) {
        setShowPaywall(true);
        throw new Error("Pro feature");
      }
      return base44.entities.ForumPost.update(postId, {
        ...post,
        upvotes: (post.upvotes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
    },
    onError: () => {}
  });

  const createCommentMutation = useMutation({
    mutationFn: (commentData) => {
      if (!subscriptionData.isPro) {
        setShowPaywall(true);
        throw new Error("Pro feature");
      }
      return base44.entities.ForumComment.create(commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setNewComment("");
    },
    onError: () => {}
  });

  const markResolvedMutation = useMutation({
    mutationFn: () => base44.entities.ForumPost.update(postId, {
      ...post,
      is_resolved: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
    },
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }

    createCommentMutation.mutate({
      post_id: postId,
      content: newComment,
      author_name: user?.full_name || "Anonymous"
    });
  };

  if (loadingPost) {
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

  if (!post) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
          <Button onClick={() => navigate(createPageUrl("Forum"))}>
            Back to Forum
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl("Forum"))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forum
        </Button>

        {!subscriptionData.isPro && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-purple-700">
                  <strong>Read-only mode:</strong> Upgrade to Pro to comment, upvote, and participate in discussions.
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-purple-600 text-sm ml-1"
                    onClick={() => setShowPaywall(true)}
                  >
                    Click here to learn more.
                  </Button>
                </p>
              </div>
            </div>
          </div>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={postTypeColors[post.post_type]}>
                {post.post_type}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {post.category.replace(/_/g, ' ')}
              </Badge>
              {post.is_resolved && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              )}
              {post.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="text-gray-600">
                  #{tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{post.author_name || post.created_by}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(post.created_date), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{post.view_count || 0} views</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{comments.length} replies</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="prose prose-green max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => upvotePostMutation.mutate()}
                className="flex items-center gap-2"
                disabled={!subscriptionData.isPro}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{post.upvotes || 0}</span>
                {!subscriptionData.isPro && <Crown className="w-3 h-3 ml-1 text-purple-600" />}
              </Button>

              {post.post_type === "question" && !post.is_resolved && user?.email === post.created_by && subscriptionData.isPro && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markResolvedMutation.mutate()}
                  className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder={subscriptionData.isPro 
                  ? "Share your thoughts, answer the question, or provide feedback..." 
                  : "Upgrade to Pro to comment and participate..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={!subscriptionData.isPro}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!newComment.trim() || createCommentMutation.isPending || !subscriptionData.isPro}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {!subscriptionData.isPro && <Crown className="w-4 h-4 mr-2" />}
                  {createCommentMutation.isPending ? "Posting..." : subscriptionData.isPro ? "Post Reply" : "Upgrade to Comment"}
                </Button>
              </div>
            </form>

            {loadingComments ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No replies yet. Be the first to respond!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment}
                    postAuthor={post.created_by}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Forum interaction (comments and upvotes)"
        />
      </div>
    </div>
  );
}