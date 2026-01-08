// src/pages/Settings.jsx
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
    const { theme, setTheme } = useTheme();

    return (
        <DashboardLayout title="Settings" showFilters={false}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                {/* Appearance */}
                <WidgetCard title="Appearance">
                    <div className="space-y-4">
                        <div>
                            <label className="text-text-tertiary text-xs uppercase tracking-wide block mb-2">Theme</label>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 p-4 rounded-lg border text-center transition-colors ${
                                        theme === 'dark' 
                                            ? 'border-accent-primary bg-accent-primary bg-opacity-10 text-text-primary' 
                                            : 'border-border-subtle bg-bg-input text-text-secondary hover:border-border-medium'
                                    }`}
                                >
                                    <span className="text-2xl block mb-1">🌙</span>
                                    <span className="text-sm font-medium">Dark</span>
                                </button>
                                <button 
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 p-4 rounded-lg border text-center transition-colors ${
                                        theme === 'light' 
                                            ? 'border-accent-primary bg-accent-primary bg-opacity-10 text-text-primary' 
                                            : 'border-border-subtle bg-bg-input text-text-secondary hover:border-border-medium'
                                    }`}
                                >
                                    <span className="text-2xl block mb-1">☀️</span>
                                    <span className="text-sm font-medium">Light</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </WidgetCard>

                {/* Notifications */}
                <WidgetCard title="Notifications">
                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-text-primary text-sm">Email alerts</span>
                            <input type="checkbox" defaultChecked className="rounded border-border-medium" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-text-primary text-sm">Push notifications</span>
                            <input type="checkbox" className="rounded border-border-medium" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-text-primary text-sm">Critical alerts only</span>
                            <input type="checkbox" className="rounded border-border-medium" />
                        </label>
                    </div>
                </WidgetCard>

                {/* Data Refresh */}
                <WidgetCard title="Data Refresh">
                    <div className="space-y-4">
                        <div>
                            <label className="text-text-tertiary text-xs uppercase tracking-wide block mb-2">Auto-refresh interval</label>
                            <select className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:border-border-focus focus:outline-none">
                                <option>5 seconds</option>
                                <option>15 seconds</option>
                                <option>30 seconds</option>
                                <option>1 minute</option>
                                <option>Disabled</option>
                            </select>
                        </div>
                    </div>
                </WidgetCard>

                {/* Account */}
                <WidgetCard title="Account">
                    <div className="space-y-4">
                        <div>
                            <label className="text-text-tertiary text-xs uppercase tracking-wide block mb-2">Username</label>
                            <input 
                                type="text" 
                                placeholder="admin" 
                                disabled
                                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-text-tertiary text-sm cursor-not-allowed"
                            />
                        </div>
                        <button className="w-full bg-bg-input border border-border-medium text-text-primary py-2 rounded-lg hover:bg-bg-surface-hover transition-colors text-sm">
                            Change Password
                        </button>
                    </div>
                </WidgetCard>
            </div>
        </DashboardLayout>
    );
}



