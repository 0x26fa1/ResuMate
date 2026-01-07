'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserCog, UserX, Trash2, UserCheck } from 'lucide-react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  user_account_status: string;
}

interface UserActionsProps {
  user: User;
  adminId: string;
}

export default function UserActions({ user, adminId }: UserActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateRole = async (newRole: string) => {
    if (user.id === adminId) {
      alert("You cannot change your own role!");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userType: newRole }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (user.id === adminId) {
      alert("You cannot deactivate your own account!");
      return;
    }

    const newStatus = user.user_account_status === 'active' ? 'inactive' : 'active';
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: newStatus }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (user.id === adminId) {
      alert("You cannot delete your own account!");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleUpdateRole('user')} disabled={user.user_type === 'user'}>
          <UserCog className="mr-2 h-4 w-4" />
          Set as User
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdateRole('hr')} disabled={user.user_type === 'hr'}>
          <UserCog className="mr-2 h-4 w-4" />
          Set as HR
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdateRole('admin')} disabled={user.user_type === 'admin'}>
          <UserCog className="mr-2 h-4 w-4" />
          Set as Admin
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleStatus}>
          {user.user_account_status === 'active' ? (
            <>
              <UserX className="mr-2 h-4 w-4" />
              Deactivate
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDeleteUser} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}