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
      title: `New Livestock Added: ${livestock.name_or_tag}`,
      description: `Added ${livestock.animal_type}${livestock.breed ? ` (${livestock.breed})` : ''} - ${livestock.name_or_tag}. Purpose: ${livestock.purpose || 'Not specified'}.`,
      financial_impact: livestock.acquisition_cost ? -livestock.acquisition_cost : null,
      related_entities: [livestock.id]
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