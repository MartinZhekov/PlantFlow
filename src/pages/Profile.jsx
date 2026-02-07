import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/api/api';
import { toast } from 'sonner';

export default function Profile() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const response = await api.auth.me();
            if (response && response.success) {
                const { full_name, email } = response.data;
                setFormData(prev => ({
                    ...prev,
                    full_name: full_name || '',
                    email: email || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setIsSaving(true);
            const updateData = {
                full_name: formData.full_name,
                email: formData.email
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await api.auth.updateProfile(updateData);

            if (response && response.success) {
                toast.success('Profile updated successfully');
                // Update local storage user data if needed for top bar
                const currentUser = JSON.parse(localStorage.getItem('plantpulse_user') || '{}');
                const updatedUser = { ...currentUser, ...response.data };
                localStorage.setItem('plantpulse_user', JSON.stringify(updatedUser));

                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    confirmPassword: ''
                }));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
                    <p className="text-slate-500">Manage your account settings and preferences</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="max-w-2xl border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your personal details here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="fullName"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="pl-9"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-9"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-medium text-slate-800 mb-4">Change Password</h3>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="pl-9 pr-9"
                                                placeholder="Leave blank to keep current"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {formData.password && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-2"
                                        >
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    className="pl-9"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
