import React, { useState, Children } from 'react';
import { motion } from 'framer-motion';
import { ViolationCard } from './ViolationCard';
import { Filter, SlidersHorizontal } from 'lucide-react';
const MOCK_DATA = [{
  id: '1',
  title: 'Public S3 Bucket Access',
  description: 'Bucket "finance-logs-2024" allows public read access via ACL configuration.',
  severity: 'critical',
  time: '2m ago',
  resource: 'aws_s3_bucket'
}, {
  id: '2',
  title: 'Unencrypted RDS Instance',
  description: 'Production database instance is running without storage encryption enabled.',
  severity: 'high',
  time: '15m ago',
  resource: 'aws_db_instance'
}, {
  id: '3',
  title: 'Security Group Port 22 Open',
  description: 'Inbound rule allows SSH traffic from 0.0.0.0/0 on launch-wizard-2.',
  severity: 'high',
  time: '1h ago',
  resource: 'aws_security_group'
}, {
  id: '4',
  title: 'IAM User with AdminAccess',
  description: 'User "deploy-bot" has AdministratorAccess policy attached directly.',
  severity: 'medium',
  time: '2h ago',
  resource: 'aws_iam_user'
}, {
  id: '5',
  title: 'MFA Not Enabled for Root',
  description: 'Root account does not have hardware MFA device configured.',
  severity: 'critical',
  time: '3h ago',
  resource: 'aws_account'
}, {
  id: '6',
  title: 'EBS Volume Unencrypted',
  description: 'Volume vol-0x8293 attached to production instance is unencrypted.',
  severity: 'medium',
  time: '4h ago',
  resource: 'aws_ebs_volume'
}, {
  id: '7',
  title: 'CloudTrail Logging Disabled',
  description: 'Logging is suspended for trail "management-events" in us-east-1.',
  severity: 'high',
  time: '5h ago',
  resource: 'aws_cloudtrail'
}, {
  id: '8',
  title: 'Old Access Key Rotation',
  description: 'Access key AKIA... for user "jdoe" is older than 90 days.',
  severity: 'low',
  time: '1d ago',
  resource: 'aws_iam_access_key'
}, {
  id: '9',
  title: 'Lambda Runtime Deprecated',
  description: 'Function "process-invoices" is using Node.js 12.x runtime.',
  severity: 'low',
  time: '1d ago',
  resource: 'aws_lambda_function'
}] as const;
interface CanvasProps {
  onSelectViolation: (id: string) => void;
  selectedId: string | null;
}
export function Canvas({
  onSelectViolation,
  selectedId
}: CanvasProps) {
  return <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0F1419]">
      {/* Canvas Header */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0F1419]/95 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-slate-200">
            Active Violations
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400 font-medium">
            {MOCK_DATA.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            View
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div variants={{
        hidden: {
          opacity: 0
        },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08
          }
        }
      }} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {MOCK_DATA.map(violation => <ViolationCard key={violation.id} {...violation} isSelected={selectedId === violation.id} onClick={() => onSelectViolation(violation.id)} />)}
        </motion.div>

        {/* Bottom spacing */}
        <div className="h-20" />
      </div>
    </div>;
}