
import { GoodsMovement } from '@/types';
import { LOCATIONS, TRANSPORT_METHODS } from '@/lib/constants';
import { formatDateTime12hr } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface DeliveryTimelineProps {
  movement: GoodsMovement;
}

export function DeliveryTimeline({ movement }: DeliveryTimelineProps) {
  const isReceived = movement.status === 'received';
  const isDispatched = movement.status === 'dispatched';

  const steps = [
    {
      label: 'Dispatched',
      description: `From ${LOCATIONS[movement.source] || 'Godown'}`,
      time: formatDateTime12hr(movement.dispatch_date),
      detail: movement.sent_by_name ? `By ${movement.sent_by_name}` : undefined,
      completed: true,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-400',
    },
    {
      label: 'In Transit',
      description: `${TRANSPORT_METHODS[movement.transport_method] || 'Auto'}${movement.auto_name ? ` - ${movement.auto_name}` : ''}`,
      time: isDispatched ? 'Currently in transit' : undefined,
      detail: movement.accompanying_person 
        ? `${movement.transport_method === 'auto' ? 'Accompanied by' : 'Carried by'} ${movement.accompanying_person}` 
        : undefined,
      completed: true,
      active: isDispatched,
      icon: Truck,
      color: isDispatched ? 'text-amber-600' : 'text-amber-600',
      bgColor: isDispatched ? 'bg-amber-100' : 'bg-amber-100',
      borderColor: isDispatched ? 'border-amber-400' : 'border-amber-400',
    },
    {
      label: 'Received',
      description: `At ${LOCATIONS[movement.destination]}`,
      time: movement.received_at ? formatDateTime12hr(movement.received_at) : undefined,
      detail: movement.received_by_name ? `By ${movement.received_by_name}` : undefined,
      completed: isReceived,
      icon: CheckCircle2,
      color: isReceived ? 'text-emerald-600' : 'text-gray-400',
      bgColor: isReceived ? 'bg-emerald-100' : 'bg-gray-100',
      borderColor: isReceived ? 'border-emerald-400' : 'border-gray-300',
    },
  ];

  return (
    <div className="relative">
      {/* Route header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
          {movement.bundles_count} {movement.movement_type === 'pieces' ? 'Pcs' : 'Bundles'}
        </Badge>
        <Badge variant="outline" className="capitalize text-xs">
          {movement.item === 'both' ? (movement.item_summary_display || 'Both') : movement.item}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <span className="font-medium">{LOCATIONS[movement.source] || 'Godown'}</span>
          <ArrowRight className="h-3 w-3" />
          <span className="font-medium">{LOCATIONS[movement.destination]}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        {steps.map((step, index) => (
          <div key={step.label} className="relative pb-6 last:pb-0">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-[-20px] top-8 w-0.5 h-[calc(100%-16px)] ${
                  step.completed && steps[index + 1].completed
                    ? 'bg-gradient-to-b from-blue-400 to-emerald-400'
                    : step.completed
                    ? 'bg-gradient-to-b from-blue-400 to-gray-300'
                    : 'bg-gray-200'
                }`}
              />
            )}

            {/* Step icon */}
            <div
              className={`absolute left-[-28px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                step.active
                  ? `${step.bgColor} ${step.borderColor} animate-pulse`
                  : step.completed
                  ? `${step.bgColor} ${step.borderColor}`
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <step.icon className={`h-3 w-3 ${step.completed ? step.color : 'text-gray-400'}`} />
            </div>

            {/* Step content */}
            <div className={`rounded-lg p-3 transition-all ${
              step.active
                ? 'bg-amber-50/80 border border-amber-200 shadow-sm'
                : step.completed
                ? 'bg-white/60'
                : 'bg-gray-50/40'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm font-semibold ${step.completed ? step.color : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {step.active && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 animate-pulse">
                    LIVE
                  </Badge>
                )}
              </div>
              <p className={`text-xs ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                {step.description}
              </p>
              {step.time && (
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {step.time}
                </p>
              )}
              {step.detail && (
                <p className="text-[11px] text-muted-foreground">{step.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
