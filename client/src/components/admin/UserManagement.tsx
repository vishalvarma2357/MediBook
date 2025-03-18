import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  
  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Filter users based on search query and role
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    
    return matchesSearch && matchesRole;
  }) || [];
  
  // Count users by role
  const userCounts = {
    all: filteredUsers.length,
    patient: filteredUsers.filter(user => user.role === "patient").length,
    doctor: filteredUsers.filter(user => user.role === "doctor").length,
    admin: filteredUsers.filter(user => user.role === "admin").length,
  };

  // Function to get badge variant based on user role
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "patient":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "doctor":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "admin":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-100";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by name or email"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Select
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="patient">Patients</SelectItem>
                    <SelectItem value="doctor">Doctors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({userCounts.all})
                </TabsTrigger>
                <TabsTrigger value="patient">
                  Patients ({userCounts.patient})
                </TabsTrigger>
                <TabsTrigger value="doctor">
                  Doctors ({userCounts.doctor})
                </TabsTrigger>
                <TabsTrigger value="admin">
                  Admins ({userCounts.admin})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 text-slate-300">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No Users Found</h3>
              <p className="text-slate-500">
                No users match your search criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center mb-4 md:mb-0">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarImage src={user.imageUrl || ""} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`capitalize ${getRoleBadgeVariant(user.role)}`}>
                      {user.role}
                    </Badge>
                    {user.role === "doctor" && (
                      <Badge variant="outline" className={user.approved 
                        ? "bg-green-100 text-green-800 hover:bg-green-100" 
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }>
                        {user.approved ? "Approved" : "Pending"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
