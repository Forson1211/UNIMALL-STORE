import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, MoreVertical, Phone, Video } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const AdminMessages = () => {
    const [activeChat, setActiveChat] = useState(1);

    const contacts = [
        { id: 1, name: "Alice Johnson", role: "Vendor", lastMsg: "When will the payout be processed?", time: "10:30 AM", unread: 2, avatar: "A" },
        { id: 2, name: "Bob Smith", role: "User", lastMsg: "I need help with my order #9821.", time: "Yesterday", unread: 0, avatar: "B" },
        { id: 3, name: "Charlie Brown", role: "Vendor", lastMsg: "Product update submitted.", time: "Yesterday", unread: 0, avatar: "C" },
    ];

    const messages = [
        { id: 1, sender: "Alice Johnson", content: "Hi admin, I requested a withdrawal yesterday.", time: "10:28 AM", isMe: false },
        { id: 2, sender: "Me", content: "Hello Alice, let me check the status for you.", time: "10:29 AM", isMe: true },
        { id: 3, sender: "Alice Johnson", content: "When will the payout be processed?", time: "10:30 AM", isMe: false },
    ];

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
                        <div className="divide-y">
                            {contacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setActiveChat(contact.id)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors ${activeChat === contact.id ? "bg-muted" : ""
                                        }`}
                                >
                                    <Avatar>
                                        <AvatarFallback>{contact.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left overflow-hidden">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold truncate">{contact.name}</span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">{contact.time}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{contact.lastMsg}</p>
                                    </div>
                                    {contact.unread > 0 && (
                                        <span className="h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                                            {contact.unread}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-muted/20">
                    {/* Header */}
                    <div className="p-4 border-b bg-card flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold">Alice Johnson</h3>
                                <p className="text-xs text-muted-foreground">Vendor • Online</p>
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
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${msg.isMe
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-card text-foreground border rounded-bl-none"
                                            }`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${msg.isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                            {msg.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 bg-card border-t">
                        <form className="flex gap-2">
                            <Input placeholder="Type your message..." className="flex-1" />
                            <Button type="submit" size="icon">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminMessages;
