# User Invitation System - Code Examples

This document provides practical code examples for working with and extending the user invitation system.

## Table of Contents

1. [Basic Usage Examples](#basic-usage-examples)
2. [Advanced Integration Examples](#advanced-integration-examples)
3. [Custom Extensions](#custom-extensions)
4. [Testing Examples](#testing-examples)
5. [Error Handling Patterns](#error-handling-patterns)

## Basic Usage Examples

### Creating a Simple Invitation

```typescript
// src/examples/basic-invitation.ts
import { createInvitation } from '../services/invites';
import { toast } from '../hooks/use-toast';

export const inviteNewCoach = async (
  email: string, 
  teamIds: number[]
) => {
  try {
    const result = await createInvitation({
      email,
      display_name: email.split('@')[0], // Use email prefix as display name
      role: 'coach',
      teamIds,
      redirectTo: `${window.location.origin}/dashboard`
    });

    if (result.ok) {
      toast({
        title: "Invitation Created",
        description: `Invitation link generated for ${email}`,
      });
      
      // Copy to clipboard automatically
      await navigator.clipboard.writeText(result.action_link);
      
      return result.action_link;
    } else {
      throw new Error(result.error || 'Failed to create invitation');
    }
  } catch (error) {
    toast({
      title: "Invitation Failed",
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: "destructive",
    });
    throw error;
  }
};
```

### Bulk Invitation Creation

```typescript
// src/examples/bulk-invitations.ts
import { createInvitation, InviteUserRequest } from '../services/invites';

interface BulkInviteData {
  email: string;
  display_name: string;
  role: 'coach' | 'admin';
  teamIds: number[];
}

export class BulkInvitationService {
  async createBulkInvitations(
    invitations: BulkInviteData[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: string[]; failed: { email: string; error: string }[] }> {
    const results = { success: [], failed: [] };
    
    for (let i = 0; i < invitations.length; i++) {
      const invite = invitations[i];
      
      try {
        const result = await createInvitation({
          ...invite,
          redirectTo: `${window.location.origin}/dashboard`
        });
        
        if (result.ok) {
          results.success.push(result.action_link);
        } else {
          results.failed.push({
            email: invite.email,
            error: result.error || 'Unknown error'
          });
        }
      } catch (error) {
        results.failed.push({
          email: invite.email,
          error: error instanceof Error ? error.message : 'Network error'
        });
      }
      
      // Report progress
      onProgress?.(i + 1, invitations.length);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
  
  async createInvitationsFromCSV(csvContent: string): Promise<string[]> {
    const lines = csvContent.split('\n').slice(1); // Skip header
    const invitations: BulkInviteData[] = [];
    
    for (const line of lines) {
      const [email, display_name, role, teamIdsStr] = line.split(',');
      
      if (email && role && teamIdsStr) {
        invitations.push({
          email: email.trim(),
          display_name: display_name?.trim() || email.split('@')[0],
          role: role.trim() as 'coach' | 'admin',
          teamIds: teamIdsStr.split(';').map(id => parseInt(id.trim()))
        });
      }
    }
    
    const results = await this.createBulkInvitations(invitations);
    return results.success;
  }
}
```

### Custom Invitation Form Component

```typescript
// src/examples/custom-invite-form.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TeamMultiSelect } from '../components/ui/team-multi-select';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { createInvitation } from '../services/invites';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.enum(['coach', 'admin']),
  teamIds: z.array(z.number()).min(1, 'At least one team must be selected'),
  redirectTo: z.string().url().optional().or(z.literal(''))
});

type InviteFormData = z.infer<typeof inviteSchema>;

export const CustomInviteForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      display_name: '',
      role: 'coach',
      teamIds: [],
      redirectTo: ''
    }
  });
  
  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await createInvitation({
        ...data,
        redirectTo: data.redirectTo || undefined
      });
      
      if (result.ok) {
        setInvitationLink(result.action_link);
        form.reset();
      } else {
        form.setError('root', { message: result.error || 'Failed to create invitation' });
      }
    } catch (error) {
      form.setError('root', { 
        message: error instanceof Error ? error.message : 'Network error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const copyToClipboard = async () => {
    if (invitationLink) {
      await navigator.clipboard.writeText(invitationLink);
      // Show success feedback
    }
  };
  
  if (invitationLink) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Invitation Created Successfully!</h3>
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 mb-2">Share this link with the invitee:</p>
          <div className="flex gap-2">
            <Input 
              value={invitationLink} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button onClick={copyToClipboard} variant="outline">
              Copy
            </Button>
          </div>
        </div>
        <Button 
          onClick={() => {
            setInvitationLink(null);
            form.reset();
          }}
          variant="outline"
        >
          Create Another Invitation
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          placeholder="coach@example.com"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium mb-1">
          Display Name
        </label>
        <Input
          id="display_name"
          {...form.register('display_name')}
          placeholder="John Coach"
        />
        {form.formState.errors.display_name && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.display_name.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <Select 
          value={form.watch('role')} 
          onValueChange={(value) => form.setValue('role', value as 'coach' | 'admin')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coach">Coach</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.role && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Teams
        </label>
        <TeamMultiSelect
          value={form.watch('teamIds')}
          onChange={(teamIds) => form.setValue('teamIds', teamIds)}
          placeholder="Select teams for the invitee"
        />
        {form.formState.errors.teamIds && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.teamIds.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="redirectTo" className="block text-sm font-medium mb-1">
          Redirect URL (Optional)
        </label>
        <Input
          id="redirectTo"
          type="url"
          {...form.register('redirectTo')}
          placeholder="https://myapp.com/welcome"
        />
        {form.formState.errors.redirectTo && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.redirectTo.message}
          </p>
        )}
      </div>
      
      {form.formState.errors.root && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            {form.formState.errors.root.message}
          </p>
        </div>
      )}
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating Invitation...' : 'Create Invitation'}
      </Button>
    </form>
  );
};
```

## Advanced Integration Examples

### React Hook for Invitation Management

```typescript
// src/hooks/useInvitations.ts
import { useState, useEffect, useCallback } from 'react';
import { createInvitation, listInvitations, InviteUserRequest, PendingInvite } from '../services/invites';

interface UseInvitationsReturn {
  invitations: PendingInvite[];
  isLoading: boolean;
  error: string | null;
  createInvite: (data: InviteUserRequest) => Promise<string | null>;
  refreshInvitations: () => Promise<void>;
  filterByStatus: (status: 'pending' | 'accepted' | 'canceled') => PendingInvite[];
}

export const useInvitations = (): UseInvitationsReturn => {
  const [invitations, setInvitations] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refreshInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await listInvitations();
      setInvitations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createInvite = useCallback(async (data: InviteUserRequest): Promise<string | null> => {
    setError(null);
    
    try {
      const result = await createInvitation(data);
      
      if (result.ok) {
        // Refresh the list to include the new invitation
        await refreshInvitations();
        return result.action_link;
      } else {
        setError(result.error || 'Failed to create invitation');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      return null;
    }
  }, [refreshInvitations]);
  
  const filterByStatus = useCallback((status: 'pending' | 'accepted' | 'canceled') => {
    return invitations.filter(invite => invite.status === status);
  }, [invitations]);
  
  useEffect(() => {
    refreshInvitations();
  }, [refreshInvitations]);
  
  return {
    invitations,
    isLoading,
    error,
    createInvite,
    refreshInvitations,
    filterByStatus
  };
};
```

### Invitation Analytics Component

```typescript
// src/components/InvitationAnalytics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useInvitations } from '../../hooks/useInvitations';

export const InvitationAnalytics: React.FC = () => {
  const { invitations, isLoading } = useInvitations();
  
  if (isLoading) {
    return <div>Loading analytics...</div>;
  }
  
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    canceled: invitations.filter(i => i.status === 'canceled').length,
    acceptanceRate: invitations.length > 0 
      ? Math.round((invitations.filter(i => i.status === 'accepted').length / invitations.length) * 100)
      : 0
  };
  
  const recentInvitations = invitations
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Accepted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## Custom Extensions

### Invitation Templates System

```typescript
// src/services/invitation-templates.ts
export interface InvitationTemplate {
  id: string;
  name: string;
  description: string;
  defaultRole: 'coach' | 'admin';
  defaultTeamIds: number[];
  customMessage?: string;
  redirectTo?: string;
}

export class InvitationTemplateService {
  private templates: InvitationTemplate[] = [
    {
      id: 'new-coach',
      name: 'New Coach',
      description: 'Standard template for inviting new coaches',
      defaultRole: 'coach',
      defaultTeamIds: [],
      customMessage: 'Welcome to our coaching team!'
    },
    {
      id: 'admin-invite',
      name: 'Admin Invitation',
      description: 'Template for inviting new administrators',
      defaultRole: 'admin',
      defaultTeamIds: [],
      redirectTo: '/admin/dashboard'
    }
  ];
  
  getTemplates(): InvitationTemplate[] {
    return this.templates;
  }
  
  getTemplate(id: string): InvitationTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }
  
  async createInvitationFromTemplate(
    templateId: string,
    overrides: Partial<InviteUserRequest>
  ): Promise<{ ok: boolean; action_link?: string; error?: string }> {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      return { ok: false, error: 'Template not found' };
    }
    
    const invitationData: InviteUserRequest = {
      role: template.defaultRole,
      teamIds: template.defaultTeamIds,
      redirectTo: template.redirectTo,
      ...overrides, // Override with provided data
      email: overrides.email!, // Email is required
    };
    
    return createInvitation(invitationData);
  }
}
```

### Invitation Expiration System

```typescript
// src/services/invitation-expiration.ts
import { supabase } from '../lib/supabase';

export class InvitationExpirationService {
  // Add expiration to existing invitations
  async addExpirationToInvitation(
    invitationId: number, 
    expirationHours: number = 168 // 7 days default
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);
    
    const { error } = await supabase
      .from('pending_invites')
      .update({ expires_at: expiresAt.toISOString() })
      .eq('id', invitationId);
    
    if (error) {
      throw new Error(`Failed to set expiration: ${error.message}`);
    }
  }
  
  // Get expired invitations
  async getExpiredInvitations(): Promise<any[]> {
    const { data, error } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      throw new Error(`Failed to get expired invitations: ${error.message}`);
    }
    
    return data || [];
  }
  
  // Cleanup expired invitations
  async cleanupExpiredInvitations(): Promise<number> {
    const { data, error } = await supabase
      .from('pending_invites')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select('id');
    
    if (error) {
      throw new Error(`Failed to cleanup expired invitations: ${error.message}`);
    }
    
    return data?.length || 0;
  }
}
```

### Custom Notification System

```typescript
// src/services/invitation-notifications.ts
export interface NotificationChannel {
  send(recipient: string, message: string, link: string): Promise<boolean>;
}

export class EmailNotificationChannel implements NotificationChannel {
  async send(recipient: string, message: string, link: string): Promise<boolean> {
    // Implement email sending logic
    console.log(`Sending email to ${recipient}: ${message}\nLink: ${link}`);
    return true;
  }
}

export class SlackNotificationChannel implements NotificationChannel {
  constructor(private webhookUrl: string) {}
  
  async send(recipient: string, message: string, link: string): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Invitation for ${recipient}: ${message}`,
          attachments: [{
            color: 'good',
            actions: [{
              type: 'button',
              text: 'Accept Invitation',
              url: link
            }]
          }]
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }
}

export class InvitationNotificationService {
  private channels: NotificationChannel[] = [];
  
  addChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }
  
  async sendInvitationNotification(
    email: string, 
    actionLink: string, 
    customMessage?: string
  ): Promise<void> {
    const message = customMessage || 'You have been invited to join our platform!';
    
    const promises = this.channels.map(channel => 
      channel.send(email, message, actionLink)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Notification channel ${index} failed:`, result.reason);
      }
    });
  }
}
```

## Testing Examples

### Unit Test for Invitation Service

```typescript
// src/services/__tests__/invites.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInvitation, listInvitations } from '../invites';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

describe('Invitation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('createInvitation', () => {
    it('should create invitation successfully', async () => {
      const mockResponse = {
        data: { ok: true, action_link: 'https://example.com/invite/123' },
        error: null
      };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);
      
      const result = await createInvitation({
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1, 2]
      });
      
      expect(result.ok).toBe(true);
      expect(result.action_link).toBe('https://example.com/invite/123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
        body: {
          email: 'test@example.com',
          role: 'coach',
          teamIds: [1, 2]
        }
      });
    });
    
    it('should handle invitation creation errors', async () => {
      const mockResponse = {
        data: { ok: false, error: 'User already exists' },
        error: null
      };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);
      
      const result = await createInvitation({
        email: 'existing@example.com',
        role: 'coach',
        teamIds: [1]
      });
      
      expect(result.ok).toBe(false);
      expect(result.error).toBe('User already exists');
    });
  });
  
  describe('listInvitations', () => {
    it('should fetch invitations successfully', async () => {
      const mockInvitations = [
        {
          id: 1,
          email: 'test@example.com',
          role: 'coach',
          status: 'pending',
          created_at: '2023-01-01T00:00:00Z'
        }
      ];
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockInvitations,
            error: null
          }))
        }))
      }));
      
      vi.mocked(supabase.from).mockReturnValue(mockFrom() as any);
      
      const result = await listInvitations();
      
      expect(result).toEqual(mockInvitations);
      expect(supabase.from).toHaveBeenCalledWith('pending_invites');
    });
  });
});
```

### Integration Test Example

```typescript
// src/__tests__/invitation-workflow.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteUserPage } from '../pages/admin/InviteUserPage';
import { createInvitation } from '../services/invites';

// Mock the service
vi.mock('../services/invites');

describe('Invitation Workflow Integration', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should complete full invitation creation workflow', async () => {
    // Mock successful invitation creation
    vi.mocked(createInvitation).mockResolvedValue({
      ok: true,
      action_link: 'https://example.com/invite/abc123'
    });
    
    render(<InviteUserPage />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/email/i), 'coach@example.com');
    await user.type(screen.getByLabelText(/display name/i), 'John Coach');
    await user.selectOptions(screen.getByLabelText(/role/i), 'coach');
    
    // Select teams (assuming TeamMultiSelect is properly mocked)
    const teamSelect = screen.getByTestId('team-multi-select');
    await user.click(teamSelect);
    await user.click(screen.getByText('Team 1'));
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /create invitation/i }));
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText(/invitation created successfully/i)).toBeInTheDocument();
    });
    
    // Verify the invitation link is displayed
    expect(screen.getByDisplayValue('https://example.com/invite/abc123')).toBeInTheDocument();
    
    // Verify the service was called correctly
    expect(createInvitation).toHaveBeenCalledWith({
      email: 'coach@example.com',
      display_name: 'John Coach',
      role: 'coach',
      teamIds: [1], // Assuming Team 1 has ID 1
      redirectTo: undefined
    });
  });
  
  it('should handle form validation errors', async () => {
    render(<InviteUserPage />);
    
    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /create invitation/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one team must be selected/i)).toBeInTheDocument();
    });
  });
});
```

## Error Handling Patterns

### Comprehensive Error Handler

```typescript
// src/lib/invitation-error-handling.ts
export enum InvitationErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  USER_EXISTS = 'USER_EXISTS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class InvitationError extends Error {
  constructor(
    public type: InvitationErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}

export const handleInvitationError = (error: any): InvitationError => {
  if (error instanceof InvitationError) {
    return error;
  }
  
  // Parse different error types
  if (error?.message?.includes('permission denied')) {
    return new InvitationError(
      InvitationErrorType.PERMISSION_DENIED,
      'You do not have permission to create invitations',
      error
    );
  }
  
  if (error?.message?.includes('already exists')) {
    return new InvitationError(
      InvitationErrorType.USER_EXISTS,
      'A user with this email already exists',
      error
    );
  }
  
  if (error?.message?.includes('validation')) {
    return new InvitationError(
      InvitationErrorType.VALIDATION_ERROR,
      'Invalid invitation data provided',
      error
    );
  }
  
  if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return new InvitationError(
      InvitationErrorType.NETWORK_ERROR,
      'Network error occurred. Please check your connection.',
      error
    );
  }
  
  return new InvitationError(
    InvitationErrorType.UNKNOWN_ERROR,
    error?.message || 'An unexpected error occurred',
    error
  );
};

export const getErrorMessage = (error: InvitationError): string => {
  switch (error.type) {
    case InvitationErrorType.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    case InvitationErrorType.PERMISSION_DENIED:
      return 'You need SUPER_ADMIN privileges to create invitations.';
    case InvitationErrorType.USER_EXISTS:
      return 'This user is already registered. Consider updating their team assignments instead.';
    case InvitationErrorType.NETWORK_ERROR:
      return 'Please check your internet connection and try again.';
    default:
      return error.message;
  }
};
```

### Error Boundary for Invitation Components

```typescript
// src/components/InvitationErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { InvitationError, InvitationErrorType, getErrorMessage } from '../lib/invitation-error-handling';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: InvitationError | null;
}

export class InvitationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    const invitationError = error instanceof InvitationError 
      ? error 
      : new InvitationError(InvitationErrorType.UNKNOWN_ERROR, error.message);
      
    return { hasError: true, error: invitationError };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Invitation component error:', error, errorInfo);
  }
  
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Invitation System Error
          </h3>
          <p className="text-gray-600 mb-4 max-w-md">
            {getErrorMessage(this.state.error)}
          </p>
          <Button onClick={this.handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

These examples provide a comprehensive foundation for working with and extending the user invitation system. They demonstrate best practices for error handling, testing, and creating reusable components that can be adapted to specific needs.