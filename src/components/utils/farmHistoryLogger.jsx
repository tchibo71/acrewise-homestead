import { base44 } from "@/api/base44Client";

/**
 * Utility to automatically log major farm events to FarmHistory
 * Call these functions after relevant actions to build passive history
 */

export async function logLivestockAdded(livestock) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: new Date().toISOString().split('T')[0],
      event_type: "milestone",
      title: `livestock_added|New Livestock: ${livestock.name_or_tag}`,
      description: `Added ${livestock.animal_type}${livestock.breed ? ` (${livestock.breed})` : ''} - ${livestock.name_or_tag}. Purpose: ${livestock.purpose || 'Not specified'}.`,
      financial_impact: livestock.acquisition_cost ? -livestock.acquisition_cost : null,
      related_entities: [`livestock:${livestock.id}`]
    });
  } catch (error) {
    console.error("Failed to log livestock addition:", error);
  }
}

export async function logGoalCompleted(goal) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: new Date().toISOString().split('T')[0],
      event_type: "success",
      title: `Goal Completed: ${goal.goal_title}`,
      description: `Successfully completed ${goal.goal_type} goal: "${goal.goal_title}". ${goal.measurable_target ? `Target: ${goal.measurable_target}` : ''}`,
      financial_impact: goal.actual_cost ? -goal.actual_cost : null,
      lessons_learned: goal.notes || null,
      related_entities: [goal.id]
    });
  } catch (error) {
    console.error("Failed to log goal completion:", error);
  }
}

export async function logMaintenanceCompleted(task) {
  // Only log major/important maintenance tasks
  if (task.priority !== "important" && task.priority !== "urgent" && task.priority !== "critical") {
    return;
  }
  
  try {
    await base44.entities.FarmHistory.create({
      event_date: new Date().toISOString().split('T')[0],
      event_type: "maintenance",
      title: `Major Maintenance: ${task.task_name}`,
      description: `Completed ${task.priority} ${task.category} maintenance: "${task.task_name}". ${task.description || ''}`,
      financial_impact: task.estimated_cost ? -task.estimated_cost : null,
      related_entities: [task.id]
    });
  } catch (error) {
    console.error("Failed to log maintenance completion:", error);
  }
}

export async function logLivestockSold(livestock, sale) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: sale.sale_date || new Date().toISOString().split('T')[0],
      event_type: "milestone",
      title: `Livestock Sold: ${livestock.name_or_tag}`,
      description: `Sold ${livestock.animal_type} - ${livestock.name_or_tag} to ${sale.buyer_name || 'buyer'}. Sale price: $${sale.sale_price || 0}.`,
      financial_impact: sale.sale_price || 0,
      related_entities: [livestock.id, sale.id]
    });
  } catch (error) {
    console.error("Failed to log livestock sale:", error);
  }
}

export async function logEmergencyEvent(title, description, financialImpact = null) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: new Date().toISOString().split('T')[0],
      event_type: "emergency",
      title: title,
      description: description,
      financial_impact: financialImpact
    });
  } catch (error) {
    console.error("Failed to log emergency event:", error);
  }
}

export async function logMilestone(title, description, financialImpact = null) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: new Date().toISOString().split('T')[0],
      event_type: "milestone",
      title: title,
      description: description,
      financial_impact: financialImpact
    });
  } catch (error) {
    console.error("Failed to log milestone:", error);
  }
}

export async function logVetVisitEvent(visit) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: visit.visit_date || new Date().toISOString().split('T')[0],
      event_type: "maintenance",
      title: `vet_visit|Vet Visit: ${(visit.visit_type || 'checkup').replace(/_/g, ' ')}`,
      description: visit.diagnosis || visit.treatment || "Veterinary visit recorded.",
      financial_impact: visit.cost ? -visit.cost : null,
      related_entities: visit.livestock_id
        ? [`livestock:${visit.livestock_id}`, `vet_visit:${visit.id}`]
        : [`vet_visit:${visit.id}`]
    });
  } catch (error) {
    console.error("Failed to log vet visit event:", error);
  }
}

export async function logWeightRecordEvent(record) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: record.measurement_date || new Date().toISOString().split('T')[0],
      event_type: "maintenance",
      title: `weight_recorded|Weight Recorded: ${record.weight} ${record.weight_unit || 'lbs'}`,
      description: record.notes || "New weight measurement logged.",
      related_entities: record.livestock_id
        ? [`livestock:${record.livestock_id}`, `weight_record:${record.id}`]
        : [`weight_record:${record.id}`]
    });
  } catch (error) {
    console.error("Failed to log weight record event:", error);
  }
}

export async function logGrazingStartEvent(pasture, record) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: record?.start_date || new Date().toISOString().split('T')[0],
      event_type: "other",
      title: `grazing_change|Grazing Started: ${pasture.name}`,
      description: `Grazing began on ${pasture.name}${pasture.acreage ? ` (${pasture.acreage} acres)` : ''}.${record?.livestock_group ? ` Group: ${record.livestock_group}.` : ''}`,
      related_entities: [`pasture:${pasture.id}`, record ? `grazing_record:${record.id}` : null].filter(Boolean)
    });
  } catch (error) {
    console.error("Failed to log grazing start event:", error);
  }
}

export async function logGrazingEndEvent(pasture, record) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: new Date().toISOString().split('T')[0],
      event_type: "other",
      title: `grazing_change|Grazing Ended: ${pasture.name}`,
      description: `Grazing ended on ${pasture.name}. Now entering rest period of ${pasture.rest_period_days || 21} days.`,
      related_entities: [`pasture:${pasture.id}`, record ? `grazing_record:${record.id}` : null].filter(Boolean)
    });
  } catch (error) {
    console.error("Failed to log grazing end event:", error);
  }
}

export async function logMajorExpenseEvent(transaction) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
      event_type: "other",
      title: `major_expense|Major Expense: $${Number(transaction.amount).toFixed(0)} — ${transaction.description || transaction.category}`,
      description: `Expense of $${Number(transaction.amount).toFixed(2)} in category: ${transaction.category}.${transaction.vendor_customer ? ` Vendor: ${transaction.vendor_customer}.` : ''}`,
      financial_impact: -transaction.amount,
      related_entities: [`financial_transaction:${transaction.id}`]
    });
  } catch (error) {
    console.error("Failed to log major expense event:", error);
  }
}

export async function logEmergencyLogEvent(emergency) {
  try {
    await base44.entities.FarmHistory.create({
      event_date: new Date().toISOString().split('T')[0],
      event_type: "emergency",
      title: `emergency|${(emergency.emergency_type || 'emergency').replace(/_/g, ' ')}: ${emergency.quick_description || 'Emergency logged'}`,
      description: `${emergency.quick_description || ''}${emergency.location_on_property ? ` Location: ${emergency.location_on_property}.` : ''} Severity: ${emergency.severity || 'high'}.`,
      financial_impact: emergency.financial_impact ? -emergency.financial_impact : null,
      related_entities: [`emergency_log:${emergency.id}`]
    });
  } catch (error) {
    console.error("Failed to log emergency event:", error);
  }
}