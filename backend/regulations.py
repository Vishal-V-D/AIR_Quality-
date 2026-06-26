# Mock semantic retrieval database representing local vector index (ChromaDB)
REGULATORY_DATASET = [
    {
        "id": "OISD-117-SEC-4.1",
        "doc": "OISD Standard 117 (Layouts and Spacing of Refineries)",
        "section": "Section 4.1 - Hot Work Permitting Clearance",
        "text": "Hot work activities (welding, cutting, grinding) must maintain a minimum physical safety buffer of 15 meters from any active flammables line. In the presence of volatile hydrocarbon deviations (exceeding 10 PPM gas), all active hot work permits within a 200m radius of the unit must be suspended immediately.",
        "keywords": ["hot work", "welding", "clearance", "hydrocarbon", "leak", "buffer", "distance"]
    },
    {
        "id": "OISD-117-SEC-5.3",
        "doc": "OISD Standard 117 (Safety Regulations for Confined Spaces)",
        "section": "Section 5.3 - Co-activity Hazards",
        "text": "Simultaneous approval of Hot Work and Confined Space Entry permits within the same unit block or within 50 meters of adjacent pipelines is strictly prohibited due to secondary ignition risks. Safe purge clearance must be logged by a safety officer prior to work onset.",
        "keywords": ["confined space", "co-activity", "conflict", "simultaneous", "ignition", "purge"]
    },
    {
        "id": "FACT-1948-SEC-36",
        "doc": "The Indian Factories Act, 1948",
        "section": "Section 36 - Precautions against Dangerous Fumes",
        "text": "No person shall be allowed or required to enter any chamber, tank, vat, pipe, or other confined space in any factory in which gas, fume, or dust is likely to be present to such an extent as to involve risk to persons, unless it is provided with a manhole of adequate size and a certificate of safety has been logged by a competent authority.",
        "keywords": ["factories act", "fumes", "vessel", "entry", "manhole", "certificate", "regulatory"]
    },
    {
        "id": "DGMS-CIRC-12",
        "doc": "DGMS Safety Circular (Heavy Machinery Safety)",
        "section": "Circular 12 - Maintenance Isolation",
        "text": "For mechanical isolation of high-pressure pumps and valves, lock-out tag-out (LOTO) protocols must be validated before work permits are activated. Co-activity checks are required to ensure no electrical test loops overlap with mechanical access points.",
        "keywords": ["isolation", "loto", "lockout", "tagout", "pump", "valve", "maintenance"]
    }
]

def search_regulations(query: str):
    """
    Simulates semantic search using keyword matching and relevance scoring.
    Returns matched paragraphs with proper citations.
    """
    query_lower = query.lower()
    matches = []
    
    for entry in REGULATORY_DATASET:
        score = 0
        for keyword in entry["keywords"]:
            if keyword in query_lower:
                score += 3
        # Direct word matches in text
        words = query_lower.split()
        for word in words:
            if len(word) > 3 and word in entry["text"].lower():
                score += 1
                
        if score > 0:
            matches.append({
                "id": entry["id"],
                "document": entry["doc"],
                "section": entry["section"],
                "text": entry["text"],
                "relevance_score": score
            })
            
    # Sort by relevance score descending
    matches = sorted(matches, key=lambda x: x["relevance_score"], reverse=True)
    
    # Return matches or a default entry if none found
    if not matches:
        return [{
            "id": "GENERAL-SAFETY-COMPLIANCE",
            "document": "General Industrial Safety Standards",
            "section": "General Directive",
            "text": "No specific citation matched your search. Ensure all standard PTW operations, LOTO checks, and gas monitoring clearances comply with local Factory Act rules.",
            "relevance_score": 0
        }]
        
    return matches
