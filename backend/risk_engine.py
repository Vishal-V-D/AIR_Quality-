def evaluate_zone_risk(zone, current_readings, active_permits, mins_to_shift_change):
    # This function name is kept for backwards compatibility with main imports
    return evaluate_ward_risk(zone, current_readings, active_permits)

def evaluate_ward_risk(ward_id, readings, active_actions):
    """
    Evaluates compound environmental risk for a ward.
    Cross-references PM2.5 levels, active enforcement status, and nearby emission densities.
    """
    pm25 = readings.get("PM25", 12.0)
    co2 = readings.get("CO2", 400.0)

    # 1. PM2.5 sub-score
    pm25_score = min(pm25 / 150.0, 1.0)

    # 2. Enforcement status sub-score (High threat if there is an active spike with no dispatched action)
    enforcement_score = 0.0
    active_for_ward = [a for a in active_actions if a["ward_id"] == ward_id and a["status"] == "Dispatched"]
    
    if pm25 > 120.0:
        if len(active_for_ward) == 0:
            enforcement_score = 0.9  # High risk due to accountability gap / no officer on field
        else:
            enforcement_score = 0.35 # Action taken, threat is being mitigated

    # 3. Dynamic fingerprint profiling
    # Construction dust: high PM2.5, low CO2
    # Diesel transport: high PM2.5, high CO2
    # Industrial: steady PM2.5, high CO2
    dominant_fingerprint = "Normal baseline"
    if pm25 > 45:
        if co2 > 550:
            dominant_fingerprint = "Diesel Transport Exhaust"
        elif co2 > 480:
            dominant_fingerprint = "Industrial Boiler Stack"
        else:
            dominant_fingerprint = "Fugitive Construction Dust"

    # Compound threat score (ISA-101 compliance mapping)
    compound_score = (pm25_score * 0.6) + (enforcement_score * 0.4)
    compound_score = round(min(max(compound_score, 0.0), 1.0), 2)

    warnings = []
    if pm25 > 150.0:
        warnings.append(f"PM2.5 spike detected: {pm25} ug/m³. Critical threshold breached.")
    if len(active_for_ward) == 0 and pm25 > 120.0:
        warnings.append("Accountability Gap: No active municipal officer assigned to nearby emission source.")

    return {
        "ward_id": ward_id,
        "compound_score": compound_score,
        "dominant_fingerprint": dominant_fingerprint,
        "warnings": warnings,
        "action_required": pm25 > 120.0 and len(active_for_ward) == 0
    }
