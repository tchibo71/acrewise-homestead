import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MessageSquare, 
  Plus, 
  Search,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Crown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CreatePostModal from "../components/forum/CreatePostModal";
import ForumPostCard from "../components/forum/ForumPostCard";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

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

export default function Forum() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['forum-posts'],
    queryFn: () => base44.entities.ForumPost.list('-created_date'),
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ['forum-comments'],
    queryFn: () => base44.entities.ForumComment.list(),
  });

  const getCommentCount = (postId) => {
    return allComments.filter(c => c.post_id === postId).length;
  };

  const handleCreatePost = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setShowCreateModal(true);
  };

  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
      const matchesType = selectedType === "all" || post.post_type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return (b.upvotes || 0) - (a.upvotes || 0);
      if (sortBy === "views") return (b.view_count || 0) - (a.view_count || 0);
      return new Date(b.created_date) - new Date(a.created_date);
    });

  const categories = [...new Set(posts.map(p => p.category))];

  const stats = {
    total: posts.length,
    questions: posts.filter(p => p.post_type === "question").length,
    resolved: posts.filter(p => p.is_resolved).length,
    discussions: posts.filter(p => p.post_type === "discussion").length
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Community Forum</h1>
              <p className="text-gray-600 mt-1">
                {subscriptionData.isPro 
                  ? "Share experiences, ask questions, learn together" 
                  : "Read-only preview mode - Upgrade to participate"}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleCreatePost}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
            {!subscriptionData.isPro && <Crown className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {!subscriptionData.isPro && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-1">
                  Read-Only Forum Access
                </h3>
                <p className="text-sm text-purple-700 mb-3">
                  You can browse posts and learn from the community. Upgrade to Pro to create posts, comment, and upvote.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate(createPageUrl("Pricing"))}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Upgrade to Participate
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.questions}</p>
                </div>
                <HelpCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Discussions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.discussions}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="question">Questions</TabsTrigger>
              <TabsTrigger value="experience">Experiences</TabsTrigger>
              <TabsTrigger value="tip">Tips</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={sortBy} onValueChange={setSortBy}>
            <TabsList className="bg-white">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="views">Most Viewed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            All Topics
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">Be the first to start a discussion!</p>
              <Button onClick={handleCreatePost} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <ForumPostCard
                key={post.id}
                post={post}
                commentCount={getCommentCount(post.id)}
                onClick={() => navigate(createPageUrl(`ForumPost?id=${post.id}`))}
              />
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreatePostModal onClose={() => setShowCreateModal(false)} />
        )}

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Forum posting and interaction"
        />
      </div>
    </div>
  );
}