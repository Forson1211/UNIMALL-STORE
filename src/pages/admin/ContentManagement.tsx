/* eslint-disable @typescript-eslint/no-explicit-any */
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    FileText,
    Plus,
    Trash2,
    Save,
    Menu,
    Image as ImageIcon,
    Upload,
} from "lucide-react";

interface PageContent {
    html: string;
    [key: string]: any;
}

interface Page {
    id: string;
    slug: string;
    title: string;
    content: PageContent;
    meta_title: string | null;
    meta_description: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

const ContentManagementSystem = () => {
    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        content: "",
        meta_title: "",
        meta_description: "",
        is_published: false,
    });

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        const { data, error } = await (supabase as any)
            .from("site_pages")
            .select("*")
            .order("updated_at", { ascending: false });

        if (error) {
            toast.error("Failed to load pages");
            return;
        }

        setPages(data || []);
    };

    const handleCreateOrUpdate = async () => {
        const payload = {
            ...formData,
            slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
            content: { html: formData.content },
        };

        if (selectedPage) {
            const { error } = await (supabase as any)
                .from("site_pages")
                .update(payload)
                .eq("id", selectedPage.id);

            if (error) {
                toast.error("Failed to update page");
                return;
            }

            toast.success("Page updated successfully");
        } else {
            const { error } = await (supabase as any).from("site_pages").insert([payload]);

            if (error) {
                toast.error("Failed to create page");
                return;
            }

            toast.success("Page created successfully");
        }

        fetchPages();
        resetForm();
    };

    const handleEdit = (page: Page) => {
        setSelectedPage(page);
        setFormData({
            title: page.title,
            slug: page.slug,
            content: page.content?.html || "",
            meta_title: page.meta_title || "",
            meta_description: page.meta_description || "",
            is_published: page.is_published,
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this page?")) return;

        const { error } = await (supabase as any).from("site_pages").delete().eq("id", id);

        if (error) {
            toast.error("Failed to delete page");
            return;
        }

        toast.success("Page deleted successfully");
        fetchPages();
    };

    const resetForm = () => {
        setFormData({
            title: "",
            slug: "",
            content: "",
            meta_title: "",
            meta_description: "",
            is_published: false,
        });
        setSelectedPage(null);
        setIsEditing(false);
    };

    return (
        <DashboardLayout type="admin" title="Content Management">
            <Tabs defaultValue="pages" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="pages">
                        <FileText className="w-4 h-4 mr-2" />
                        Pages
                    </TabsTrigger>
                    <TabsTrigger value="menus">
                        <Menu className="w-4 h-4 mr-2" />
                        Menus
                    </TabsTrigger>
                    <TabsTrigger value="media">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Media Library
                    </TabsTrigger>
                </TabsList>

                {/* Pages Tab */}
                <TabsContent value="pages">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Pages List */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>All Pages</CardTitle>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            resetForm();
                                            setIsEditing(true);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Page
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {pages.map((page) => (
                                    <div
                                        key={page.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                                        onClick={() => handleEdit(page)}
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{page.title}</p>
                                            <p className="text-xs text-muted-foreground">/{page.slug}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {page.is_published ? (
                                                <Badge className="bg-green-500">Published</Badge>
                                            ) : (
                                                <Badge variant="outline">Draft</Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(page.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Page Editor */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>
                                    {selectedPage ? "Edit Page" : "Create New Page"}
                                </CardTitle>
                                <CardDescription>
                                    Manage your site's pages and content
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Page Title</Label>
                                                <Input
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, title: e.target.value })
                                                    }
                                                    placeholder="About Us"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="slug">URL Slug</Label>
                                                <Input
                                                    id="slug"
                                                    value={formData.slug}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, slug: e.target.value })
                                                    }
                                                    placeholder="about-us"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="content">Page Content</Label>
                                            <Textarea
                                                id="content"
                                                value={formData.content}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, content: e.target.value })
                                                }
                                                rows={10}
                                                placeholder="Enter your page content here..."
                                            />
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="metaTitle">Meta Title</Label>
                                                <Input
                                                    id="metaTitle"
                                                    value={formData.meta_title}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            meta_title: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="metaDesc">Meta Description</Label>
                                                <Input
                                                    id="metaDesc"
                                                    value={formData.meta_description}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            meta_description: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={formData.is_published}
                                                    onCheckedChange={(checked) =>
                                                        setFormData({ ...formData, is_published: checked })
                                                    }
                                                />
                                                <Label>Publish Page</Label>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={resetForm}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCreateOrUpdate}>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {selectedPage ? "Update" : "Create"} Page
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">
                                            Select a page to edit or create a new one
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Menus Tab */}
                <TabsContent value="menus">
                    <Card>
                        <CardHeader>
                            <CardTitle>Navigation Menus</CardTitle>
                            <CardDescription>
                                Manage your site's navigation menus
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Menu editor coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Media Library Tab */}
                <TabsContent value="media">
                    <Card>
                        <CardHeader>
                            <CardTitle>Media Library</CardTitle>
                            <CardDescription>Upload and manage media files</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed rounded-lg p-12 text-center">
                                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">
                                    Drag and drop files here or click to browse
                                </p>
                                <Button>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Files
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
};

export default ContentManagementSystem;
