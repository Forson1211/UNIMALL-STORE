import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, MoreVertical, Phone, Video, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
    sender?: { full_name: string; avatar_url: string; email: string };
    receiver?: { full_name: string; avatar_url: string; email: string };
}

interface Thread {
    partnerId: string;
    partnerName: string;
    partnerAvatar: string;
    partnerEmail: string;
    lastMsg: string;
    time: string;
    messages: Message[];
}

const AdminMessages = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");

    // Fetch all messages (Admin View)
    const { data: rawMessages = [], isLoading } = useQuery({
        queryKey: ['admin-messages'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(full_name, avatar_url, email),
                    receiver:receiver_id(full_name, avatar_url, email)
                `)
                .order('created_at', { ascending: true }); // Oldest first for chat history

            if (error) throw error;
            return data as Message[];
        },
    });

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ receiverId, content }: { receiverId: string, content: string }) => {
            const { error } = await (supabase as any)
                .from('messages')
                .insert({
                    sender_id: user?.id,
                    receiver_id: receiverId,
                    content: content,
                    read: false
                });
            if (error) throw error;
        },
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
        }
    });

    // Process messages into threads
    const threads = useMemo(() => {
        const threadMap = new Map<string, Thread>();

        rawMessages.forEach((msg: Message) => {
            // Determine the "Other" person in the conversation relative to the Admin (or just distinct pairs)
            const p1 = msg.sender_id;
            const p2 = msg.receiver_id;
            // Create a unique key for the pair [min, max]
            const pairKey = p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;

            if (!threadMap.has(pairKey)) {
                // If it's the current user sending, partner is receiver. If receiving, partner is sender.
                // If neither (viewing 3rd party), default to Sender as "primary"? 
                const isMeSender = msg.sender_id === user?.id;
                const partner = isMeSender ? msg.receiver : msg.sender;

                // Fallback for 3rd party view: Just verify looking at Sender
                const pName = partner?.full_name || partner?.email || "Unknown User";

                threadMap.set(pairKey, {
                    partnerId: isMeSender ? msg.receiver_id : msg.sender_id,
                    partnerName: pName,
                    partnerAvatar: partner?.avatar_url || "",
                    partnerEmail: partner?.email || "",
                    lastMsg: msg.content,
                    time: msg.created_at,
                    messages: []
                });
            }

            const thread = threadMap.get(pairKey)!;
            thread.messages.push(msg);
            thread.lastMsg = msg.content; // Keep updating to latest
            thread.time = msg.created_at;
        });

        // Convert map to array and sort by latest time
        return Array.from(threadMap.values()).sort((a, b) =>
            new Date(b.time).getTime() - new Date(a.time).getTime()
        );
    }, [rawMessages, user?.id]);

    // Set active thread if none selected
    useEffect(() => {
        if (!activeThreadId && threads.length > 0) {
            setActiveThreadId(threads[0].partnerId);
        }
    }, [threads, activeThreadId]);

    const activeThread = threads.find(t => t.partnerId === activeThreadId) || threads[0];

    return (
        <DashboardLayout type="admin" title="Messages Center">
            <div className="flex h-[calc(100vh-12rem)] bg-card rounded-xl border shadow-sm overflow-hidden animate-fade-in">
                {/* Sidebar */}
                <div className="w-80 border-r flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search messages..." className="pl-8 bg-background" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="divide-y text-left">
                            {isLoading ? (
                                <div className="p-4 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></div>
                            ) : threads.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">No messages found</div>
                            ) : (
                                threads.map((thread) => (
                                    <button
                                        key={thread.partnerId}
                                        onClick={() => setActiveThreadId(thread.partnerId)}
                                        className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors ${activeThread?.partnerId === thread.partnerId ? "bg-muted" : ""}`}
                                    >
                                        <Avatar>
                                            <AvatarImage src={thread.partnerAvatar} />
                                            <AvatarFallback>{thread.partnerName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-left overflow-hidden">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold truncate">{thread.partnerName}</span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(thread.time), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{thread.lastMsg}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-muted/20">
                    {activeThread ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b bg-card flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={activeThread.partnerAvatar} />
                                        <AvatarFallback>{activeThread.partnerName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{activeThread.partnerName}</h3>
                                        <p className="text-xs text-muted-foreground">{activeThread.partnerEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {activeThread.messages.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                                        : "bg-card text-foreground border rounded-bl-none"
                                                        }`}
                                                >
                                                    {!isMe && <p className="text-[10px] opacity-70 mb-1">{msg.sender?.full_name}</p>}
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>

                            {/* Input */}
                            <div className="p-4 bg-card border-t">
                                <form
                                    className="flex gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (newMessage.trim()) {
                                            sendMessageMutation.mutate({ receiverId: activeThread.partnerId, content: newMessage });
                                        }
                                    }}
                                >
                                    <Input
                                        placeholder="Type your message..."
                                        className="flex-1"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button type="submit" size="icon" disabled={sendMessageMutation.isPending}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            {isLoading ? "Loading..." : "Select a conversation to start messaging"}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminMessages;
