import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Mail, Calendar, Shield, Search, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface UserListItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: users, isLoading, refetch } = useQuery<UserListItem[]>({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.role === "admin",
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role: newRole });
      toast({
        title: "ロール更新完了",
        description: "ユーザーのロールが更新されました",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "ロールの更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen gradient-neutral bg-gray-900 flex items-center justify-center p-4">
        <Card className="glass border-white/10">
          <CardContent className="text-center p-8">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">アクセス権限がありません</h2>
            <p className="text-gray-400">この機能は管理者のみ利用できます</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users?.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.includes(searchTerm) ||
    user.lastName?.includes(searchTerm)
  ) || [];

  return (
    <div className="min-h-screen gradient-neutral bg-gray-900 p-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">ユーザー管理</h1>
            <p className="text-gray-400">登録済みユーザーの一覧と管理</p>
          </div>
        </div>

        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              ユーザー一覧
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="ユーザー検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-white/20 text-white placeholder-gray-400"
                  data-testid="input-user-search"
                />
              </div>
              <div className="text-sm text-gray-400">
                {filteredUsers.length}名のユーザー
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white">ユーザー</TableHead>
                      <TableHead className="text-white">メール</TableHead>
                      <TableHead className="text-white">氏名</TableHead>
                      <TableHead className="text-white">ロール</TableHead>
                      <TableHead className="text-white">登録日</TableHead>
                      <TableHead className="text-white">ステータス</TableHead>
                      <TableHead className="text-white">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-white/10">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-white">@{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-white">
                            <span>{user.lastName} {user.firstName}</span>
                            {user.lastNameKana && user.firstNameKana && (
                              <span className="text-xs text-gray-400 ml-2">
                                ({user.lastNameKana} {user.firstNameKana})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === "admin" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {user.role === "admin" ? "管理者" : "一般"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {format(new Date(user.createdAt), "yyyy/MM/dd", { locale: ja })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.emailVerified 
                              ? "bg-green-900/30 text-green-400 border border-green-400/20" 
                              : "bg-red-900/30 text-red-400 border border-red-400/20"
                          }`}>
                            {user.emailVerified ? (
                              <>
                                <UserCheck className="h-3 w-3" />
                                認証済み
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3" />
                                未認証
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.id !== currentUser?.id && (
                              <>
                                {user.role !== "admin" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRoleChange(user.id, "admin")}
                                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                                    data-testid={`button-promote-${user.username}`}
                                  >
                                    管理者に昇格
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRoleChange(user.id, "user")}
                                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                                    data-testid={`button-demote-${user.username}`}
                                  >
                                    一般に降格
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">ユーザーが見つかりません</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}