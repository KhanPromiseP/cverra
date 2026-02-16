import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CloudArrowDownIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    platformName: 'Inlirah',
    supportEmail: 'support@inlirah.com',
    defaultCurrency: 'USD',
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    analyticsTracking: true,
    autoBackup: true,
    backupFrequency: 'daily',
    maxResumesPerUser: 10,
    maxCoverLettersPerUser: 10,
    fileSizeLimit: 10, // MB
    sessionTimeout: 60 // minutes
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      platformName: 'Inlirah',
      supportEmail: 'support@inlirah.com',
      defaultCurrency: 'USD',
      maintenanceMode: false,
      userRegistration: true,
      emailNotifications: true,
      analyticsTracking: true,
      autoBackup: true,
      backupFrequency: 'daily',
      maxResumesPerUser: 10,
      maxCoverLettersPerUser: 10,
      fileSizeLimit: 10,
      sessionTimeout: 60
    });
    toast.info('Settings reset to defaults');
  };

  const handleBackupNow = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Backup completed successfully');
    } catch (error) {
      toast.error('Backup failed');
    }
  };

  const navigationItems = [
    { id: 'general', name: 'General Settings', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'billing', name: 'Billing', icon: CurrencyDollarIcon },
    { id: 'users', name: 'User Management', icon: UserGroupIcon },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Platform Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Platform Name
            </label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Default Currency
            </label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="XAF">XAF - Central African CFA Franc</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
              min="5"
              max="480"
            />
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">User Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Max Resumes Per User
            </label>
            <input
              type="number"
              value={settings.maxResumesPerUser}
              onChange={(e) => setSettings({ ...settings, maxResumesPerUser: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Max Cover Letters Per User
            </label>
            <input
              type="number"
              value={settings.maxCoverLettersPerUser}
              onChange={(e) => setSettings({ ...settings, maxCoverLettersPerUser: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              File Size Limit (MB)
            </label>
            <input
              type="number"
              value={settings.fileSizeLimit}
              onChange={(e) => setSettings({ ...settings, fileSizeLimit: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
              min="1"
              max="50"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlatformFeatures = () => (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-6">Platform Features</h3>
      <div className="space-y-6">
        {[
          {
            id: 'maintenanceMode',
            label: 'Maintenance Mode',
            description: 'Put the platform in maintenance mode. Users will see a maintenance page.',
            value: settings.maintenanceMode
          },
          {
            id: 'userRegistration',
            label: 'User Registration',
            description: 'Allow new users to register accounts on the platform.',
            value: settings.userRegistration
          },
          {
            id: 'emailNotifications',
            label: 'Email Notifications',
            description: 'Send email notifications for important events and updates.',
            value: settings.emailNotifications
          },
          {
            id: 'analyticsTracking',
            label: 'Analytics Tracking',
            description: 'Track user behavior and platform usage statistics.',
            value: settings.analyticsTracking
          },
          {
            id: 'autoBackup',
            label: 'Auto Backup',
            description: 'Automatically backup platform data according to schedule.',
            value: settings.autoBackup
          },
        ].map((feature) => (
          <div key={feature.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="font-semibold text-foreground">{feature.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{feature.description}</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, [feature.id]: !feature.value })}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                feature.value ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  feature.value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-6">Backup & Recovery</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Backup Frequency
          </label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
            disabled={!settings.autoBackup}
          >
            <option value="hourly">Every Hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {!settings.autoBackup && (
            <p className="text-sm text-muted-foreground mt-2">Enable Auto Backup to configure frequency</p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleBackupNow}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
          >
            <CloudArrowDownIcon className="h-5 w-5" />
            Backup Now
          </button>
          <button className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-xl font-semibold transition-colors">
            <ArrowPathIcon className="h-5 w-5" />
            Restore Backup
          </button>
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="font-semibold text-foreground mb-2">Last Backup</h4>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleString()} - 2.4 GB
          </p>
        </div>
      </div>
    </div>
  );

  const renderDangerZone = () => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Danger Zone</h3>
      </div>
      <p className="text-red-700 dark:text-red-300 mb-6">
        These actions are irreversible and will affect all users. Please proceed with extreme caution.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
          <TrashIcon className="h-5 w-5" />
          Clear All User Data
        </button>
        <button className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
          <ArrowPathIcon className="h-5 w-5" />
          Reset Platform
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">Configure platform settings and preferences</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleResetSettings}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-semibold transition-colors shadow-sm"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-xl font-semibold transition-colors shadow-lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Saving...
              </div>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'general' && (
            <>
              {renderGeneralSettings()}
              {renderPlatformFeatures()}
              {renderBackupSettings()}
              {renderDangerZone()}
            </>
          )}
          
          {activeSection !== 'general' && (
            <div className="bg-card text-card-foreground p-8 rounded-xl border shadow-sm text-center">
              <div className="text-muted-foreground text-lg mb-2">
                {navigationItems.find(item => item.id === activeSection)?.name}
              </div>
              <p className="text-muted-foreground">
                This section is under development and will be available soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};