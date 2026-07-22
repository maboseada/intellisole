"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Plus,
  MessageCircle,
  MoreHorizontal,
  Clock,
  Heart
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

// Post Type
interface Post {
  id: string;
  author_id: string;
  author: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  created_at: string;
}

// Mock fallback
const MOCK_POSTS = [
  { id: "1", author_id: "mock-1", author: "Sarah Jenkins", role: "Patient", content: "Just reached 30 days of consistent foot monitoring. Feeling great and no complications!", likes: 24, comments: 5, time: "2h ago", created_at: new Date().toISOString() },
  { id: "2", author_id: "mock-2", author: "Dr. Roberts", role: "Doctor", content: "Reminder to all patients: keep your salt intake low to reduce foot swelling during these hot days.", likes: 45, comments: 12, time: "5h ago", created_at: new Date().toISOString() },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("Feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      fetchPosts();
    };
    init();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    // In a real app, we'd join with 'users' table to get names/roles
    // For now, let's fetch 'posts' and map or fallback to mock
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:author_id(full_name, role)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      setPosts(MOCK_POSTS as any);
    } else {
      setPosts(data.map((p: any) => ({
        id: p.id,
        author_id: p.author_id,
        author: p.author?.full_name || "User",
        role: p.author?.role || "Patient",
        content: p.content,
        likes: p.likes || 0,
        comments: 0,
        time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(p.created_at)),
        created_at: p.created_at
      })));
    }
    setLoading(false);
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));

    // Check if it's a real UUID (from DB) or a mock ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
    
    if (!isUUID) {
      console.log("Mock post liked locally");
      return;
    }

    const { error } = await supabase
      .from('posts')
      .update({ likes: currentLikes + 1 })
      .eq('id', postId);

    if (error) {
      console.error("Could not update like", error);
      // Revert if error
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes } : p));
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        title: "Discussion", // Schema requires title
        content: newPostContent,
        likes: 0
      })
      .select('*, author:author_id(full_name, role)')
      .single();

    if (error) {
      console.error("Failed to share post", error);
    } else {
      console.log("Post shared with community!");
      setNewPostContent("");
      setShowCreate(false);
      fetchPosts();
    }
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Community Hub</h1>
            <p className="text-slate-500 dark:text-slate-400">Connect with other patients and healthcare professionals.</p>
          </div>
          <Button 
            size="sm" 
            className="shadow-lg shadow-blue-500/20"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus className="w-4 h-4 mr-2" /> {showCreate ? "Cancel" : "Start Discussion"}
          </Button>
        </header>

        {showCreate && (
          <Card className="animate-in slide-in-from-top-4 duration-300 border-2 border-blue-100 dark:border-blue-900/30">
            <CardContent className="p-6 space-y-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind? Share an update or ask a question..."
                className="w-full min-h-[120px] bg-transparent text-lg focus:outline-none resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleCreatePost} 
                  disabled={isSubmitting || !newPostContent.trim()}
                  className="px-8"
                >
                  {isSubmitting ? "Sharing..." : "Post to Community"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
            {["Feed", "Trending", "Groups", "My Posts"].map((tab) => (
                <button 
                    key={tab} 
                    className={cn(
                        "pb-4 text-sm font-semibold transition-all relative px-2",
                        activeTab === tab ? "text-blue-600 after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-1 after:bg-blue-600 after:rounded-full" : "text-slate-400 hover:text-slate-600"
                    )}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab}
                </button>
            ))}
        </section>

        <section className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-3 space-y-6">
                {posts.map((post) => (
                    <Card key={post.id} className="glass">
                        <CardHeader className="flex flex-row items-start justify-between pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-slate-500">
                                    {post.author[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-50">{post.author}</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={post.role === "Doctor" ? "default" : "secondary"} className="text-[10px] uppercase py-0 px-1.5">{post.role}</Badge>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {post.time}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="p-0 h-8 w-8 text-slate-400">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                                {post.content}
                            </p>
                            <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-slate-500 hover:text-red-500 hover:bg-red-50"
                                      onClick={() => handleLike(post.id, post.likes)}
                                    >
                                        <Heart className="w-4 h-4 mr-2" /> {post.likes} Likes
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-slate-500">
                                        <MessageCircle className="w-4 h-4 mr-2" /> {post.comments} Comments
                                    </Button>
                                </div>
                                <Button variant="ghost" size="sm" className="text-slate-500">
                                    <Share2 className="w-4 h-4 mr-2" /> Share
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <aside className="space-y-6">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-base">Trending Topics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {["#FootCare", "#DiabetesManagement", "#NewSocks", "#SafeExercises"].map((tag) => (
                            <Link key={tag} href="#" className="block text-sm text-blue-600 hover:underline font-medium">{tag}</Link>
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center text-blue-700 dark:text-blue-400">
                            <Users className="w-4 h-4 mr-2" /> Suggested Groups
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between group">
                            <span className="text-sm font-medium">Type 2 Warriors</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100">Join</Button>
                        </div>
                        <div className="flex items-center justify-between group">
                            <span className="text-sm font-medium">Post-Op Support</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100">Join</Button>
                        </div>
                    </CardContent>
                </Card>
            </aside>
        </section>
      </div>
    </DashboardLayout>
  );
}
