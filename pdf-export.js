// PDF Export Functions
const PDFExport = (function() {
    // Export Handover PDF with ISBAR format
    function exportHandoverPDF(patient, signature = "Nurse. Ahmed Khaled") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('PDF library not loaded. Please check your internet connection.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const isbar = patient.isbar || {};

        const primaryColor = [67, 78, 120]; // #434E78
        const secondaryColor = [96, 123, 143]; // #607B8F
        const accentOrange = [233, 127, 74]; // #E97F4A

        // Header with gradient effect
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 30, 'F');
        
        // Logo/text in header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("N", 15, 18);
        
        doc.setFontSize(16);
        doc.text("Nuraithm", 22, 18);
        
        doc.setFontSize(10);
        doc.text("Clinical Handover Report", 105, 12, { align: "center" });
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 105, 18, { align: "center" });
        
        doc.setFontSize(8);
        doc.text("ADVANCED CLINICAL INTELLIGENCE SYSTEM", 105, 24, { align: "center" });

        // Patient Information Box
        doc.setFillColor(248, 250, 252); // Light gray
        doc.rect(10, 35, 190, 20, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.rect(10, 35, 190, 20);
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("PATIENT HANDOVER REPORT", 105, 43, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`Patient: ${patient.name} | MRN: ${patient.fileNumber} | Room: ${patient.roomNumber}`, 105, 50, { align: "center" });

        let startY = 60;

        // ISBAR Sections
        
        // 1. IDENTIFICATION (I)
        doc.setFillColor(...primaryColor);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text("I - IDENTIFICATION", 15, startY + 5.5);
        
        startY += 10;
        
        const idData = [
            ['Patient Name', isbar.identification?.patient_name || patient.name || 'N/A'],
            ['MRN', isbar.identification?.mrn || patient.fileNumber || 'N/A'],
            ['Age', isbar.identification?.age || patient.age || 'N/A'],
            ['Room No', isbar.identification?.room_no || patient.roomNumber || 'N/A'],
            ['Admission Date', isbar.identification?.admission_date || 'N/A'],
            ['Admitted From', isbar.identification?.admitted_from || 'N/A'],
            ['Consultant', isbar.identification?.consultant || 'N/A']
        ];
        
        doc.autoTable({
            startY: startY,
            head: [['Field', 'Value']],
            body: idData,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 115 }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 2. SITUATION (S)
        doc.setFillColor(...primaryColor);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text("S - SITUATION", 15, startY + 5.5);
        
        startY += 10;
        
        const situationData = [
            ['Primary Diagnosis', patient.diagnosis || 'N/A'],
            ['Current Complaints', isbar.current_complaints?.complaints || 'N/A'],
            ['Diet', isbar.current_complaints?.diet || 'N/A']
        ];
        
        // Add connections
        if (isbar.current_complaints?.connections && isbar.current_complaints.connections.length > 0) {
            situationData.push(['Connections', isbar.current_complaints.connections.map(c => `${c.name} (${c.date})`).join(', ')]);
        }
        
        // Add infusions
        if (isbar.current_complaints?.infusions && isbar.current_complaints.infusions.length > 0) {
            situationData.push(['Infusions', isbar.current_complaints.infusions.map(i => `${i.name} @ ${i.rate}`).join(', ')]);
        }
        
        doc.autoTable({
            startY: startY,
            head: [['Field', 'Value']],
            body: situationData,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 115 }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 3. BACKGROUND (B)
        doc.setFillColor(...primaryColor);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text("B - BACKGROUND", 15, startY + 5.5);
        
        startY += 10;
        
        const backgroundData = [
            ['Past Medical History', isbar.background?.past_medical_history || 'N/A'],
            ['Chief Complaint', isbar.background?.chief_complaint || 'N/A'],
            ['Allergies', isbar.background?.allergy || 'None'],
            ['Isolation Needs', isbar.background?.infections_isolation || 'None']
        ];
        
        doc.autoTable({
            startY: startY,
            head: [['Field', 'Value']],
            body: backgroundData,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 115 }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 4. ASSESSMENT (A)
        doc.setFillColor(...accentOrange);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text("A - ASSESSMENT", 15, startY + 5.5);
        
        startY += 10;
        
        const assessmentData = [
            ['GCS', isbar.assessment?.gcs || '15'],
            ['Fall Risk', isbar.assessment?.fall_risk || 'N/A'],
            ['Vital Signs', isbar.assessment?.vitals || 'N/A'],
            ['Ventilation', isbar.assessment?.ventilation || 'Room Air'],
            ['Bed Sore', isbar.assessment?.bed_sore || 'No'],
            ['Physical Restraint', isbar.assessment?.physical_restraint || 'No'],
            ['Important Findings', isbar.assessment?.important_findings || 'N/A']
        ];
        
        doc.autoTable({
            startY: startY,
            head: [['Field', 'Value']],
            body: assessmentData,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 115 }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 5. RECOMMENDATION (R)
        doc.setFillColor(...secondaryColor);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text("R - RECOMMENDATION", 15, startY + 5.5);
        
        startY += 10;
        
        const recommendationData = [
            ['Plan of Care', isbar.recommendations?.plan_of_care || 'N/A'],
            ['Risks', isbar.recommendations?.risks || 'N/A']
        ];
        
        // Add physician orders
        if (isbar.recommendations?.physician_orders && isbar.recommendations.physician_orders.length > 0) {
            isbar.recommendations.physician_orders.forEach((order, index) => {
                recommendationData.push([`Order ${index + 1}`, `${order.order} (${order.status})`]);
            });
        }
        
        // Add cultures
        if (isbar.recommendations?.cultures && isbar.recommendations.cultures.length > 0) {
            isbar.recommendations.cultures.forEach((culture, index) => {
                recommendationData.push([`Culture ${index + 1}`, `${culture.name}: ${culture.result}`]);
            });
        }
        
        doc.autoTable({
            startY: startY,
            head: [['Field', 'Value']],
            body: recommendationData,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 115 }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 15;

        // Medications Section
        if (patient.medications && patient.medications.length > 0) {
            doc.setFillColor(...primaryColor);
            doc.rect(10, startY, 190, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("CURRENT MEDICATIONS", 15, startY + 5.5);
            
            startY += 10;
            
            const medData = patient.medications.map(med => [
                med.name || 'N/A',
                med.dosage || 'N/A',
                med.frequency || 'N/A'
            ]);
            
            doc.autoTable({
                startY: startY,
                head: [['Medication', 'Dosage', 'Frequency']],
                body: medData,
                theme: 'grid',
                headStyles: { fillColor: [67, 78, 120], textColor: [255, 255, 255], fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 3 },
                margin: { left: 15, right: 15 }
            });
            
            startY = doc.lastAutoTable.finalY + 10;
        }

        // Pending Tasks
        if (patient.todos && patient.todos.filter(t => !t.completed).length > 0) {
            const pendingTodos = patient.todos.filter(t => !t.completed);
            
            doc.setFillColor(...accentOrange);
            doc.rect(10, startY, 190, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("PENDING TASKS", 15, startY + 5.5);
            
            startY += 10;
            
            const todoData = pendingTodos.map(todo => [
                todo.text || 'N/A',
                todo.createdAt ? new Date(todo.createdAt).toLocaleDateString() : 'N/A'
            ]);
            
            doc.autoTable({
                startY: startY,
                head: [['Task', 'Created']],
                body: todoData,
                theme: 'grid',
                headStyles: { fillColor: [233, 127, 74], textColor: [255, 255, 255], fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 3 },
                margin: { left: 15, right: 15 }
            });
            
            startY = doc.lastAutoTable.finalY + 10;
        }

        // Signature Section
        const signatureY = Math.min(startY + 20, 270);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(15, signatureY - 5, 195, signatureY - 5);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Handover Date/Time: ${new Date().toLocaleDateString()} @ ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 15, signatureY);
        doc.text(`Outgoing Nurse: ${signature}`, 15, signatureY + 10);
        doc.text("Receiving Nurse: ___________________", 15, signatureY + 20);
        
        // Footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Nuraithm Smart Medical Systems - AI Certified Clinical Record", 105, 285, { align: "center" });
        doc.text("Confidential Medical Document - For authorized personnel only", 105, 288, { align: "center" });

        // Save PDF
        const fileName = `Handover_${(isbar.identification?.mrn || patient.fileNumber || 'UNKNOWN').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    // Export Report PDF
    function exportReportPDF(title, content, fileName, signature = "Nurse. Ahmed Khaled", tableData) {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('PDF library not loaded. Please check your internet connection.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Header
        doc.setFillColor(67, 78, 120);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 105, 14, { align: "center" });
        doc.setFontSize(8);
        doc.text(`Clinical Report Generated: ${new Date().toLocaleString()}`, 105, 20, { align: "center" });
        
        // Content
        if (tableData) {
            doc.autoTable({
                startY: 30,
                head: [tableData.headers],
                body: tableData.rows,
                theme: 'grid',
                headStyles: { fillColor: [67, 78, 120], fontSize: 9, halign: 'center', textColor: [255, 255, 255] },
                styles: { fontSize: 8 },
                margin: { top: 30 },
                pageBreak: 'auto'
            });
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            const splitText = doc.splitTextToSize(content, 180);
            doc.text(splitText, 15, 40);
        }
        
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
        
        // Signature
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Clinician Signature: ${signature}`, 15, Math.min(finalY, 270));
        
        // Footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Nuraithm Clinical AI Intelligence - Medical Record.", 105, 285, { align: "center" });
        doc.text("Document ID: " + Date.now().toString(36).toUpperCase(), 105, 288, { align: "center" });

        doc.save(`${fileName.replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}.pdf`);
    }

    // Export Medication Table PDF
    function exportMedicationTablePDF(patient, medTable, signature = "Nurse. Ahmed Khaled") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('PDF library not loaded. Please check your internet connection.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Header
        doc.setFillColor(67, 78, 120);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("SMART MEDICATION ANALYSIS", 105, 14, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Patient: ${patient.name} | MRN: ${patient.fileNumber}`, 105, 20, { align: "center" });
        
        // Patient Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Diagnosis: ${patient.diagnosis || 'Not specified'}`, 15, 35);
        doc.text(`Age: ${patient.age || 'N/A'} | Room: ${patient.roomNumber || 'N/A'}`, 15, 40);
        
        // Medication Table
        if (medTable && medTable.headers && medTable.rows) {
            doc.autoTable({
                startY: 45,
                head: [medTable.headers],
                body: medTable.rows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [67, 78, 120], 
                    fontSize: 9, 
                    halign: 'center', 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: { 
                    fontSize: 8,
                    cellPadding: 3
                },
                margin: { top: 45 },
                pageBreak: 'auto',
                columnStyles: {
                    0: { cellWidth: 40 }, // Medication name
                    1: { cellWidth: 30 }, // Dosage
                    2: { cellWidth: 30 }, // Frequency
                    3: { cellWidth: 90 }  // Notes
                }
            });
        }
        
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 60;
        
        // Clinical Notes
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Clinical Notes:", 15, finalY);
        doc.setFont('helvetica', 'normal');
        
        const notes = [
            "1. Administer medications as per prescribed schedule",
            "2. Monitor for side effects and document accordingly",
            "3. Verify patient identity before medication administration",
            "4. Document any medication refusal or adverse reactions",
            "5. Ensure proper storage and handling of medications"
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, 20, finalY + 5 + (index * 5));
        });
        
        // Signature
        const signatureY = finalY + 5 + (notes.length * 5) + 10;
        doc.setFontSize(10);
        doc.text(`Prepared by: ${signature}`, 15, signatureY);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, signatureY + 5);
        
        // Footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Nuraithm Smart Medication Management System", 105, 285, { align: "center" });
        doc.text("AI-Powered Clinical Decision Support", 105, 288, { align: "center" });

        doc.save(`Medication_Analysis_${patient.fileNumber || 'UNKNOWN'}_${Date.now().toString().slice(-6)}.pdf`);
    }

    // Export Care Plan PDF
    function exportCarePlanPDF(patient, carePlan, signature = "Nurse. Ahmed Khaled") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('PDF library not loaded. Please check your internet connection.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Header
        doc.setFillColor(67, 78, 120);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("NURSING CARE PLAN", 105, 14, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Patient: ${patient.name} | MRN: ${patient.fileNumber}`, 105, 20, { align: "center" });
        
        // Patient Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Diagnosis: ${patient.diagnosis || 'Not specified'}`, 15, 35);
        doc.text(`Age: ${patient.age || 'N/A'} | Room: ${patient.roomNumber || 'N/A'} | Admission: ${patient.isbar?.identification?.admission_date || 'N/A'}`, 15, 40);
        
        // Care Plan Table
        if (carePlan && carePlan.headers && carePlan.rows) {
            doc.autoTable({
                startY: 45,
                head: [carePlan.headers],
                body: carePlan.rows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [67, 78, 120], 
                    fontSize: 9, 
                    halign: 'center', 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: { 
                    fontSize: 8,
                    cellPadding: 3,
                    overflow: 'linebreak'
                },
                margin: { top: 45 },
                pageBreak: 'auto',
                columnStyles: {
                    0: { cellWidth: 45 }, // Diagnosis
                    1: { cellWidth: 40 }, // Goals
                    2: { cellWidth: 60 }, // Interventions
                    3: { cellWidth: 45 }  // Evaluation
                }
            });
        }
        
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 60;
        
        // Nursing Notes
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Nursing Implementation Notes:", 15, finalY);
        doc.setFont('helvetica', 'normal');
        
        const nursingNotes = [
            "1. Implement care plan interventions as scheduled",
            "2. Document patient responses to interventions",
            "3. Reevaluate care plan goals regularly",
            "4. Communicate changes in patient status to healthcare team",
            "5. Provide patient and family education as appropriate"
        ];
        
        nursingNotes.forEach((note, index) => {
            doc.text(note, 20, finalY + 5 + (index * 5));
        });
        
        // Signature
        const signatureY = finalY + 5 + (nursingNotes.length * 5) + 10;
        doc.setFontSize(10);
        doc.text(`Care Plan Prepared by: ${signature}`, 15, signatureY);
        doc.text(`Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 15, signatureY + 5);
        
        // Review Schedule
        doc.text("Next Care Plan Review: ___________________", 15, signatureY + 15);
        
        // Footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Nuraithm Nursing Care Planning System - NANDA-I Based", 105, 285, { align: "center" });
        doc.text("Evidence-Based Practice Guidelines Incorporated", 105, 288, { align: "center" });

        doc.save(`Care_Plan_${patient.fileNumber || 'UNKNOWN'}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // Export Shift Report PDF
    function exportShiftReportPDF(patient, shiftReport, signature = "Nurse. Ahmed Khaled") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('PDF library not loaded. Please check your internet connection.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Header
        doc.setFillColor(67, 78, 120);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("NURSING SHIFT REPORT", 105, 14, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Patient: ${patient.name} | Shift: ${new Date().toLocaleDateString()}`, 105, 20, { align: "center" });
        
        // Shift Information
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`MRN: ${patient.fileNumber} | Room: ${patient.roomNumber} | Diagnosis: ${patient.diagnosis || 'Not specified'}`, 15, 35);
        
        // Shift Report Content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("Shift Summary:", 15, 45);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const splitText = doc.splitTextToSize(shiftReport || 'No shift report available.', 180);
        doc.text(splitText, 15, 50);
        
        // Recent Events
        const eventsY = 50 + (splitText.length * 5) + 10;
        if (patient.isbar?.shift_notes && patient.isbar.shift_notes.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text("Recent Clinical Events:", 15, eventsY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            patient.isbar.shift_notes.slice(0, 5).forEach((event, index) => {
                const yPos = eventsY + 5 + (index * 5);
                if (yPos < 250) { // Avoid going off page
                    doc.text(`${event.time}: ${event.event}`, 20, yPos);
                }
            });
        }
        
        // Vital Signs
        const vitalsY = eventsY + (patient.isbar?.shift_notes?.length > 0 ? 5 + (Math.min(5, patient.isbar.shift_notes.length) * 5) : 0) + 10;
        if (patient.isbar?.assessment?.vitals) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text("Vital Signs Summary:", 15, vitalsY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(patient.isbar.assessment.vitals, 20, vitalsY + 5);
        }
        
        // Signature Section
        const signatureY = Math.min(vitalsY + 20, 260);
        doc.setDrawColor(200, 200, 200);
        doc.line(15, signatureY - 5, 195, signatureY - 5);
        
        doc.setFontSize(10);
        doc.text(`Shift: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 15, signatureY);
        doc.text(`Reporting Nurse: ${signature}`, 15, signatureY + 10);
        doc.text("Receiving Nurse: ___________________", 15, signatureY + 20);
        
        // Footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Nuraithm Shift Reporting System - SBAR Communication Format", 105, 285, { align: "center" });
        doc.text("Timely and Accurate Clinical Communication", 105, 288, { align: "center" });

        doc.save(`Shift_Report_${patient.fileNumber || 'UNKNOWN'}_${Date.now().toString().slice(-6)}.pdf`);
    }

    // Export Patient Summary
    function exportPatientSummary(patient) {
        const content = `
PATIENT SUMMARY REPORT
======================

Patient Information:
--------------------
Name: ${patient.name}
MRN: ${patient.fileNumber}
Age: ${patient.age}
Room: ${patient.roomNumber}
Status: ${patient.status}
Admission Date: ${patient.isbar?.identification?.admission_date || 'N/A'}

Clinical Information:
---------------------
Diagnosis: ${patient.diagnosis}
Consultant: ${patient.isbar?.identification?.consultant || 'N/A'}
Allergies: ${patient.isbar?.background?.allergy || 'None'}
Isolation: ${patient.isbar?.background?.infections_isolation || 'None'}

Current Medications (${patient.medications?.length || 0}):
---------------------
${(patient.medications || []).map(med => `• ${med.name} - ${med.dosage} (${med.frequency})`).join('\n')}

Recent Clinical Events:
-----------------------
${(patient.isbar?.shift_notes || []).slice(0, 5).map(note => `• ${note.time}: ${note.event}`).join('\n')}

Pending Tasks (${patient.todos?.filter(t => !t.completed).length || 0}):
-----------------
${(patient.todos?.filter(t => !t.completed) || []).map(todo => `• ${todo.text}`).join('\n')}

Assessment Summary:
-------------------
GCS: ${patient.isbar?.assessment?.gcs || '15'}
Fall Risk: ${patient.isbar?.assessment?.fall_risk || 'N/A'}
Vital Signs: ${patient.isbar?.assessment?.vitals || 'N/A'}

Plan of Care:
-------------
${patient.isbar?.recommendations?.plan_of_care || 'Continue current management'}

Generated by Nuraithm Clinical System
${new Date().toLocaleString()}
Version: 2.0.0
        `;

        Utils.downloadFile(content, `Patient_Summary_${patient.fileNumber || 'UNKNOWN'}.txt`, 'text/plain');
    }

    // Export Data as CSV
    function exportAsCSV(data, fileName) {
        if (!data || data.length === 0) {
            console.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                }).join(',')
            )
        ];

        const csvString = csvRows.join('\n');
        Utils.downloadFile(csvString, `${fileName}.csv`, 'text/csv');
    }

    // Export All Patient Data
    function exportAllPatientData(patient) {
        const data = {
            patient: {
                basicInfo: {
                    name: patient.name,
                    fileNumber: patient.fileNumber,
                    age: patient.age,
                    roomNumber: patient.roomNumber,
                    diagnosis: patient.diagnosis,
                    status: patient.status,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt
                },
                isbar: patient.isbar || {},
                medications: patient.medications || [],
                todos: patient.todos || [],
                labs: patient.labs || [],
                radiology: patient.radiology || [],
                reports: patient.reports || []
            },
            exportInfo: {
                exportedAt: new Date().toISOString(),
                exportedBy: "Nuraithm System",
                version: "2.0.0"
            }
        };

        const jsonString = JSON.stringify(data, null, 2);
        Utils.downloadFile(jsonString, `Patient_Data_${patient.fileNumber || 'UNKNOWN'}_Full.json`, 'application/json');
    }

    // Public API
    return {
        exportHandoverPDF,
        exportReportPDF,
        exportMedicationTablePDF,
        exportCarePlanPDF,
        exportShiftReportPDF,
        exportPatientSummary,
        exportAllPatientData,
        exportAsCSV
    };
})();

// Make PDF export globally available
window.PDFExport = PDFExport;