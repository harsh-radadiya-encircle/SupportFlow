import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi, UserItem } from '../api/users.api';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { DataTable, Column, FilterOption } from '../../../shared/components/ui/DataTable';
import {
  Users,
  Trash2,
  AlertTriangle,
  UserCheck,
  Shield,
  Building,
  Mail,
  Sparkles,
} from 'lucide-react';

export const AllUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => usersApi.getAllUsers(),
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: (res) => {
      toast.success(res.message || 'User deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['users', 'all'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete user account.');
    },
  });

  const handleDeleteClick = (userItem: UserItem) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete user account "${userItem.fullName}" (${userItem.email})?`
      )
    ) {
      deleteUserMutation.mutate(userItem.id);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.businessName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !roleFilter || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof typeof a];
    let bVal: any = b[sortColumn as keyof typeof b];

    if (sortColumn === 'createdAt') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedUsers = sortedUsers.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(sortedUsers.length / limit) || 1;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return <Badge variant="danger">Platform Admin</Badge>;
      case 'BUSINESS_ADMIN':
        return <Badge variant="purple">Business Admin</Badge>;
      case 'SUPPORT_AGENT':
        return <Badge variant="success">Support Agent</Badge>;
      case 'CUSTOMER':
      default:
        return <Badge variant="info">Customer</Badge>;
    }
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'role',
      label: 'All User Roles',
      value: roleFilter,
      onChange: (val) => {
        setRoleFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Roles', value: '' },
        { label: 'Platform Admin', value: 'PLATFORM_ADMIN' },
        { label: 'Business Admin', value: 'BUSINESS_ADMIN' },
        { label: 'Support Agent', value: 'SUPPORT_AGENT' },
        { label: 'Customer', value: 'CUSTOMER' },
      ],
    },
  ];

  const columns: Column<UserItem>[] = [
    {
      key: 'fullName',
      header: 'Full Name & Email',
      sortable: true,
      className: 'w-2/5 min-w-[240px]',
      render: (u) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{u.fullName}</span>
          </div>
          <div className="text-xs text-slate-500 font-normal flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400" /> {u.email}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'User Role',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (u) => getRoleBadge(u.role),
    },
    {
      key: 'businessName',
      header: 'Organization',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (u) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-800 font-medium">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{u.businessName}</span>
        </div>
      ),
    },
    {
      key: 'authProvider',
      header: 'Auth Provider',
      className: 'whitespace-nowrap',
      render: (u) => (
        <Badge variant="ghost" className="text-xs font-semibold text-slate-600 uppercase">
          {u.authProvider}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registered Date',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (u) => (
        <span className="text-sm text-slate-600 font-normal">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      render: (u) => (
        <Button
          variant="outline"
          size="sm"
          className="border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs disabled:opacity-40"
          disabled={u.role === 'PLATFORM_ADMIN'}
          isLoading={deleteUserMutation.isPending && deleteUserMutation.variables === u.id}
          onClick={() => handleDeleteClick(u)}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
        </Button>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load registered platform users</span>
        </div>
        <p className="text-xs text-rose-600">
          {(error as any)?.response?.data?.message || 'An error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
            <Badge variant="purple" className="text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" /> Global User Directory
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Manage all registered users across customers, support agents, business owners, and
            platform administrators.
          </p>
        </div>
      </div>

      {/* Universal DataTable Integration */}
      <DataTable
        title="Users"
        totalCount={sortedUsers.length}
        data={paginatedUsers}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search full name, email, or organization..."
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        filterOptions={filterOptions}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={(key) => {
          if (sortColumn === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
          } else {
            setSortColumn(key);
            setSortDirection('desc');
          }
        }}
        page={page}
        limit={limit}
        total={sortedUsers.length}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="No registered users match your search or filter criteria."
      />
    </div>
  );
};
