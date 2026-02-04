import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockUsers } from "@/data/mockDashboardData";
import { User } from "@/types/dashboard";
import { MoreHorizontal, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusStyles: Record<User['status'], string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

const roleStyles: Record<User['role'], string> = {
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  vendor: "bg-secondary/10 text-secondary border-secondary/20",
  customer: "bg-primary/10 text-primary border-primary/20",
};

const userColumns = [
  {
    key: "name",
    header: "User",
    render: (user: User) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    className: "hidden md:table-cell",
    render: (user: User) => (
      <Badge variant="outline" className={roleStyles[user.role]}>
        {user.role}
      </Badge>
    ),
  },
  {
    key: "campus",
    header: "Campus",
    className: "hidden md:table-cell",
    render: (user: User) => user.campus || "-",
  },
  {
    key: "status",
    header: "Status",
    render: (user: User) => (
      <Badge variant="outline" className={statusStyles[user.status]}>
        {user.status}
      </Badge>
    ),
  },
  {
    key: "createdAt",
    header: "Joined",
    sortable: true,
    className: "hidden lg:table-cell",
    render: (user: User) => new Date(user.createdAt).toLocaleDateString(),
  },
  {
    key: "actions",
    header: "",
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Profile</DropdownMenuItem>
          <DropdownMenuItem>Edit User</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Suspend User</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const AdminUsers = () => {
  return (
    <DashboardLayout type="admin" title="Users">
      <DataTable
        title="All Users"
        data={mockUsers}
        columns={userColumns}
        searchKey="name"
        searchPlaceholder="Search users..."
        actions={
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        }
      />
    </DashboardLayout>
  );
};

export default AdminUsers;
