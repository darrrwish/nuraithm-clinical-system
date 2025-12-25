// PDF Export Functions - تصميم برتقالي حديث
const PDFExport = (function() {
    // تصدير PDF لتسليم الحالة مع تصميم برتقالي
    function exportHandoverPDF(patient, signature = "Nurse. Ahmed Khaled", receivingNurse = "___________________") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('مكتبة PDF غير محملة. يرجى التحقق من اتصال الإنترنت.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const isbar = patient.isbar || {};

        // الألوان البرتقالية
        const primaryColor = [255, 107, 53];    // #FF6B35
        const secondaryColor = [255, 142, 83];  // #FF8E53
        const accentColor = [255, 181, 99];     // #FFB563
        const darkColor = [26, 26, 46];         // #1A1A2E
        const lightColor = [248, 249, 250];     // #F8F9FA

        // الرأس مع تدرج لوني
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        
        // شعار/نص في الرأس
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text("N", 20, 25);
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("Nuraithm", 30, 25);
        
        doc.setFontSize(12);
        doc.text("نظام التسليم السريري الذكي", 105, 18, { align: "center" });
        doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`, 105, 25, { align: "center" });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("نظام ذكي مدعوم بالذكاء الاصطناعي للرعاية الصحية", 105, 32, { align: "center" });

        // معلومات المريض
        doc.setFillColor(lightColor);
        doc.rect(10, 45, 190, 15, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.rect(10, 45, 190, 15);
        
        doc.setTextColor(...primaryColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("تقرير تسليم الحالة السريرية", 105, 53, { align: "center" });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`المريض: ${patient.name} | الرقم: ${patient.fileNumber} | الغرفة: ${patient.roomNumber}`, 105, 60, { align: "center" });

        let startY = 70;

        // أقسام ISBAR
        
        // 1. الهوية (I)
        doc.setFillColor(...primaryColor);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("I - الهوية", 15, startY + 5.5);
        
        startY += 10;
        
        const idData = [
            ['اسم المريض', isbar.identification?.patient_name || patient.name || 'غير محدد'],
            ['الرقم الطبي', isbar.identification?.mrn || patient.fileNumber || 'غير محدد'],
            ['العمر', isbar.identification?.age || patient.age || 'غير محدد'],
            ['رقم الغرفة', isbar.identification?.room_no || patient.roomNumber || 'غير محدد'],
            ['تاريخ القبول', isbar.identification?.admission_date || 'غير محدد'],
            ['قادم من', isbar.identification?.admitted_from || 'غير محدد'],
            ['الطبيب المعالج', isbar.identification?.consultant || 'غير محدد']
        ];
        
        doc.autoTable({
            startY: startY,
            head: [['المجال', 'القيمة']],
            body: idData,
            theme: 'grid',
            headStyles: { 
                fillColor: primaryColor, 
                textColor: [255, 255, 255], 
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'right'
            },
            styles: { 
                fontSize: 10, 
                cellPadding: 4,
                textColor: [0, 0, 0],
                halign: 'right'
            },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { 
                    cellWidth: 60, 
                    fontStyle: 'bold',
                    textColor: primaryColor,
                    halign: 'right'
                },
                1: { 
                    cellWidth: 115,
                    textColor: darkColor,
                    halign: 'right'
                }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 2. الحالة (S)
        doc.setFillColor(...secondaryColor);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("S - الحالة", 15, startY + 5.5);
        
        startY += 10;
        
        const situationData = [
            ['التشخيص الرئيسي', patient.diagnosis || 'غير محدد'],
            ['الشكوى الحالية', isbar.current_complaints?.complaints || 'غير محدد'],
            ['الحمية الغذائية', isbar.current_complaints?.diet || 'غير محدد']
        ];
        
        // إضافة الاتصالات
        if (isbar.current_complaints?.connections && isbar.current_complaints.connections.length > 0) {
            situationData.push(['الاتصالات', isbar.current_complaints.connections.map(c => `${c.name} (${c.date})`).join(', ')]);
        }
        
        // إضافة المحاليل
        if (isbar.current_complaints?.infusions && isbar.current_complaints.infusions.length > 0) {
            situationData.push(['المحاليل', isbar.current_complaints.infusions.map(i => `${i.name} @ ${i.rate}`).join(', ')]);
        }
        
        doc.autoTable({
            startY: startY,
            head: [['المجال', 'القيمة']],
            body: situationData,
            theme: 'grid',
            headStyles: { 
                fillColor: secondaryColor, 
                textColor: [255, 255, 255], 
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'right'
            },
            styles: { 
                fontSize: 10, 
                cellPadding: 4,
                textColor: [0, 0, 0],
                halign: 'right'
            },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { 
                    cellWidth: 60, 
                    fontStyle: 'bold',
                    textColor: secondaryColor,
                    halign: 'right'
                },
                1: { 
                    cellWidth: 115,
                    textColor: darkColor,
                    halign: 'right'
                }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 3. الخلفية (B)
        doc.setFillColor(...accentColor);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("B - الخلفية", 15, startY + 5.5);
        
        startY += 10;
        
        const backgroundData = [
            ['التاريخ المرضي', isbar.background?.past_medical_history || 'غير محدد'],
            ['سبب القبول', isbar.background?.chief_complaint || 'غير محدد'],
            ['الحساسيات', isbar.background?.allergy || 'لا يوجد'],
            ['متطلبات العزل', isbar.background?.infections_isolation || 'لا يوجد']
        ];
        
        doc.autoTable({
            startY: startY,
            head: [['المجال', 'القيمة']],
            body: backgroundData,
            theme: 'grid',
            headStyles: { 
                fillColor: accentColor, 
                textColor: [255, 255, 255], 
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'right'
            },
            styles: { 
                fontSize: 10, 
                cellPadding: 4,
                textColor: [0, 0, 0],
                halign: 'right'
            },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { 
                    cellWidth: 60, 
                    fontStyle: 'bold',
                    textColor: accentColor,
                    halign: 'right'
                },
                1: { 
                    cellWidth: 115,
                    textColor: darkColor,
                    halign: 'right'
                }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 4. التقييم (A)
        doc.setFillColor(255, 142, 83);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("A - التقييم", 15, startY + 5.5);
        
        startY += 10;
        
        const assessmentData = [
            ['مقياس غلاسكو', isbar.assessment?.gcs || '15'],
            ['خطر السقوط', isbar.assessment?.fall_risk || 'منخفض'],
            ['العلامات الحيوية', isbar.assessment?.vitals || 'غير محدد'],
            ['الدعم التنفسي', isbar.assessment?.ventilation || 'هواء الغرفة'],
            ['قرحة الفراش', isbar.assessment?.bed_sore || 'لا'],
            ['التقييد البدني', isbar.assessment?.physical_restraint || 'لا'],
            ['الملاحظات الهامة', isbar.assessment?.important_findings || 'غير محدد']
        ];
        
        doc.autoTable({
            startY: startY,
            head: [['المجال', 'القيمة']],
            body: assessmentData,
            theme: 'grid',
            headStyles: { 
                fillColor: [255, 142, 83], 
                textColor: [255, 255, 255], 
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'right'
            },
            styles: { 
                fontSize: 10, 
                cellPadding: 4,
                textColor: [0, 0, 0],
                halign: 'right'
            },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { 
                    cellWidth: 60, 
                    fontStyle: 'bold',
                    textColor: [255, 142, 83],
                    halign: 'right'
                },
                1: { 
                    cellWidth: 115,
                    textColor: darkColor,
                    halign: 'right'
                }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 10;

        // 5. التوصيات (R)
        doc.setFillColor(255, 181, 99);
        doc.rect(10, startY, 190, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("R - التوصيات", 15, startY + 5.5);
        
        startY += 10;
        
        const recommendationData = [
            ['خطة الرعاية', isbar.recommendations?.plan_of_care || 'غير محدد'],
            ['المخاطر', isbar.recommendations?.risks || 'غير محدد']
        ];
        
        // إضافة أوامر الطبيب
        if (isbar.recommendations?.physician_orders && isbar.recommendations.physician_orders.length > 0) {
            isbar.recommendations.physician_orders.forEach((order, index) => {
                recommendationData.push([`أمر ${index + 1}`, `${order.order} (${order.status})`]);
            });
        }
        
        doc.autoTable({
            startY: startY,
            head: [['المجال', 'القيمة']],
            body: recommendationData,
            theme: 'grid',
            headStyles: { 
                fillColor: [255, 181, 99], 
                textColor: [255, 255, 255], 
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'right'
            },
            styles: { 
                fontSize: 10, 
                cellPadding: 4,
                textColor: [0, 0, 0],
                halign: 'right'
            },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { 
                    cellWidth: 60, 
                    fontStyle: 'bold',
                    textColor: [255, 181, 99],
                    halign: 'right'
                },
                1: { 
                    cellWidth: 115,
                    textColor: darkColor,
                    halign: 'right'
                }
            }
        });
        
        startY = doc.lastAutoTable.finalY + 15;

        // قسم الأدوية
        if (patient.medications && patient.medications.length > 0) {
            doc.setFillColor(...primaryColor);
            doc.rect(10, startY, 190, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("الأدوية الحالية", 15, startY + 5.5);
            
            startY += 10;
            
            const medData = patient.medications.map(med => [
                med.name || 'غير محدد',
                med.dosage || 'غير محدد',
                med.frequency || 'غير محدد',
                med.route || 'فموي'
            ]);
            
            doc.autoTable({
                startY: startY,
                head: [['الدواء', 'الجرعة', 'التكرار', 'طريقة الاستعمال']],
                body: medData,
                theme: 'grid',
                headStyles: { 
                    fillColor: primaryColor, 
                    textColor: [255, 255, 255], 
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'right'
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 4,
                    textColor: [0, 0, 0],
                    halign: 'right'
                },
                margin: { left: 15, right: 15 }
            });
            
            startY = doc.lastAutoTable.finalY + 10;
        }

        // المهام المعلقة
        if (patient.todos && patient.todos.filter(t => !t.completed).length > 0) {
            const pendingTodos = patient.todos.filter(t => !t.completed);
            
            doc.setFillColor(...accentColor);
            doc.rect(10, startY, 190, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("المهام المعلقة", 15, startY + 5.5);
            
            startY += 10;
            
            const todoData = pendingTodos.map(todo => [
                todo.text || 'غير محدد',
                todo.createdAt ? new Date(todo.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'
            ]);
            
            doc.autoTable({
                startY: startY,
                head: [['المهمة', 'تاريخ الإنشاء']],
                body: todoData,
                theme: 'grid',
                headStyles: { 
                    fillColor: accentColor, 
                    textColor: [255, 255, 255], 
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'right'
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 4,
                    textColor: [0, 0, 0],
                    halign: 'right'
                },
                margin: { left: 15, right: 15 }
            });
            
            startY = doc.lastAutoTable.finalY + 10;
        }

        // قسم التوقيعات
        const signatureY = Math.min(startY + 20, 270);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(15, signatureY - 5, 195, signatureY - 5);
        
        doc.setFontSize(11);
        doc.setTextColor(...darkColor);
        doc.text(`تاريخ ووقت التسليم: ${new Date().toLocaleDateString('ar-EG')} الساعة ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`, 15, signatureY);
        doc.text(`الممرض/الممرضة المسلمة: ${signature}`, 15, signatureY + 10);
        doc.text(`الممرض/الممرضة المستقبلة: ${receivingNurse}`, 15, signatureY + 20);
        
        // التذييل
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("نظام نورعيظم الطبي الذكي - سجل سريري معتمد بالذكاء الاصطناعي", 105, 285, { align: "center" });
        doc.text("وثيقة طبية سرية - للموظفين المصرح لهم فقط", 105, 288, { align: "center" });

        // حفظ PDF
        const fileName = `تسليم_${(patient.name || 'مريض').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        return {
            success: true,
            fileName: fileName
        };
    }

    // تصدير تقرير PDF عام
    function exportReportPDF(title, content, fileName, signature = "Nurse. Ahmed Khaled", tableData) {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('مكتبة PDF غير محملة. يرجى التحقق من اتصال الإنترنت.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // الرأس بألوان برتقالية
        doc.setFillColor(255, 107, 53);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 105, 16, { align: "center" });
        doc.setFontSize(9);
        doc.text(`تم الإنشاء: ${new Date().toLocaleString('ar-EG')}`, 105, 22, { align: "center" });
        doc.text("نظام نورعيظم الطبي الذكي", 105, 28, { align: "center" });
        
        // المحتوى
        if (tableData) {
            doc.autoTable({
                startY: 35,
                head: [tableData.headers],
                body: tableData.rows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [255, 107, 53], 
                    fontSize: 10, 
                    halign: 'right', 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: { 
                    fontSize: 9,
                    textColor: [0, 0, 0],
                    halign: 'right'
                },
                margin: { top: 35 },
                pageBreak: 'auto'
            });
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(content, 180);
            doc.text(splitText, 15, 40);
        }
        
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 100;
        
        // التوقيع
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`التوقيع: ${signature}`, 15, Math.min(finalY, 270));
        
        // التذييل
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("نظام نورعيظم للذكاء السريري - سجل طبي إلكتروني", 105, 285, { align: "center" });
        doc.text(`معرف المستند: ${Date.now().toString(36).toUpperCase()}`, 105, 288, { align: "center" });

        doc.save(`${fileName.replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}.pdf`);
        
        return {
            success: true,
            fileName: fileName
        };
    }

    // تصدير جدول الأدوية
    function exportMedicationTablePDF(patient, medTable, signature = "Nurse. Ahmed Khaled") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('مكتبة PDF غير محملة. يرجى التحقق من اتصال الإنترنت.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // الرأس
        doc.setFillColor(255, 107, 53);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("تحليل الأدوية الذكي", 105, 16, { align: "center" });
        doc.setFontSize(11);
        doc.text(`المريض: ${patient.name} | الرقم: ${patient.fileNumber}`, 105, 23, { align: "center" });
        doc.setFontSize(9);
        doc.text("تحليل تفاعلي للأدوية بناءً على حالة المريض", 105, 28, { align: "center" });
        
        // معلومات المريض
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`التشخيص: ${patient.diagnosis || 'غير محدد'}`, 15, 40);
        doc.text(`العمر: ${patient.age || 'غير محدد'} | الغرفة: ${patient.roomNumber || 'غير محدد'}`, 15, 45);
        
        // جدول الأدوية
        if (medTable && medTable.headers && medTable.rows) {
            doc.autoTable({
                startY: 50,
                head: [medTable.headers],
                body: medTable.rows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [255, 107, 53], 
                    fontSize: 10, 
                    halign: 'right', 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: { 
                    fontSize: 9,
                    cellPadding: 4,
                    textColor: [0, 0, 0],
                    halign: 'right'
                },
                margin: { top: 50 },
                pageBreak: 'auto',
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 90 }
                }
            });
        }
        
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 65;
        
        // ملاحظات سريرية
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 107, 53);
        doc.text("ملاحظات سريرية:", 15, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const notes = [
            "1. إعطاء الأدوية حسب الجدول المحدد",
            "2. مراقبة الآثار الجانبية وتسجيلها",
            "3. التحقق من هوية المريض قبل إعطاء الدواء",
            "4. تسجيل أي رفض للدواء أو ردود فعل سلبية",
            "5. التأكد من التخزين الصحيح للأدوية"
        ];
        
        notes.forEach((note, index) => {
            doc.text(note, 20, finalY + 5 + (index * 5));
        });
        
        // التوقيع
        const signatureY = finalY + 5 + (notes.length * 5) + 10;
        doc.setFontSize(11);
        doc.text(`أعد بواسطة: ${signature}`, 15, signatureY);
        doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, 15, signatureY + 5);
        
        // التذييل
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("نظام نورعيظم لإدارة الأدوية الذكية", 105, 285, { align: "center" });
        doc.text("نظام دعم القرار السريري المدعوم بالذكاء الاصطناعي", 105, 288, { align: "center" });

        const fileName = `تحليل_أدوية_${patient.fileNumber || 'غير_محدد'}_${Date.now().toString().slice(-6)}.pdf`;
        doc.save(fileName);
        
        return {
            success: true,
            fileName: fileName
        };
    }

    // تصدير خطة الرعاية
    function exportCarePlanPDF(patient, carePlan, signature = "Nurse. Ahmed Khaled") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('مكتبة PDF غير محملة. يرجى التحقق من اتصال الإنترنت.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // الرأس
        doc.setFillColor(255, 107, 53);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("خطة الرعاية التمريضية", 105, 16, { align: "center" });
        doc.setFontSize(11);
        doc.text(`المريض: ${patient.name} | الرقم: ${patient.fileNumber}`, 105, 23, { align: "center" });
        doc.setFontSize(9);
        doc.text("بناءً على معايير NANDA-I والممارسة القائمة على الأدلة", 105, 28, { align: "center" });
        
        // معلومات المريض
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`التشخيص: ${patient.diagnosis || 'غير محدد'}`, 15, 40);
        doc.text(`العمر: ${patient.age || 'غير محدد'} | الغرفة: ${patient.roomNumber || 'غير محدد'} | القبول: ${patient.isbar?.identification?.admission_date || 'غير محدد'}`, 15, 45);
        
        // جدول خطة الرعاية
        if (carePlan && carePlan.headers && carePlan.rows) {
            doc.autoTable({
                startY: 50,
                head: [carePlan.headers],
                body: carePlan.rows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [255, 107, 53], 
                    fontSize: 10, 
                    halign: 'right', 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: { 
                    fontSize: 9,
                    cellPadding: 4,
                    overflow: 'linebreak',
                    textColor: [0, 0, 0],
                    halign: 'right'
                },
                margin: { top: 50 },
                pageBreak: 'auto',
                columnStyles: {
                    0: { cellWidth: 45 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 60 },
                    3: { cellWidth: 45 }
                }
            });
        }
        
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 65;
        
        // ملاحظات التمريض
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 107, 53);
        doc.text("ملاحظات التنفيذ التمريضي:", 15, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const nursingNotes = [
            "1. تنفيذ تدخلات خطة الرعاية حسب الجدول",
            "2. توثيق استجابات المريض للتدخلات",
            "3. إعادة تقييم أهداف خطة الرعاية بانتظام",
            "4. التواصل مع فريق الرعاية الصحية حول تغيرات حالة المريض",
            "5. تثقيف المريض والعائلة حسب الحاجة"
        ];
        
        nursingNotes.forEach((note, index) => {
            doc.text(note, 20, finalY + 5 + (index * 5));
        });
        
        // التوقيع
        const signatureY = finalY + 5 + (nursingNotes.length * 5) + 10;
        doc.setFontSize(11);
        doc.text(`أعدت بواسطة: ${signature}`, 15, signatureY);
        doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')} | الوقت: ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`, 15, signatureY + 5);
        
        // جدول المراجعة
        doc.text("موعد المراجعة القادمة: ___________________", 15, signatureY + 15);
        
        // التذييل
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("نظام نورعيظم للتخطيط التمريضي - معتمد على معايير NANDA-I", 105, 285, { align: "center" });
        doc.text("إرشادات الممارسة القائمة على الأدلة", 105, 288, { align: "center" });

        const fileName = `خطة_رعاية_${patient.fileNumber || 'غير_محدد'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        return {
            success: true,
            fileName: fileName
        };
    }

    // تصدير تقرير الشفت
    function exportShiftReportPDF(patient, shiftReport, signature = "Nurse. Ahmed Khaled", receivingNurse = "___________________") {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF not loaded');
            alert('مكتبة PDF غير محملة. يرجى التحقق من اتصال الإنترنت.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // الرأس
        doc.setFillColor(255, 107, 53);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("تقرير الشفت التمريضي", 105, 16, { align: "center" });
        doc.setFontSize(11);
        doc.text(`المريض: ${patient.name} | الشفت: ${new Date().toLocaleDateString('ar-EG')}`, 105, 23, { align: "center" });
        doc.setFontSize(9);
        doc.text("نظام SBAR للتواصل السريري", 105, 28, { align: "center" });
        
        // معلومات الشفت
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`الرقم: ${patient.fileNumber} | الغرفة: ${patient.roomNumber} | التشخيص: ${patient.diagnosis || 'غير محدد'}`, 15, 40);
        
        // محتوى تقرير الشفت
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("ملخص الشفت:", 15, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        
        const splitText = doc.splitTextToSize(shiftReport || 'لا يوجد تقرير شفت متاح.', 180);
        doc.text(splitText, 15, 55);
        
        // الأحداث الأخيرة
        const eventsY = 55 + (splitText.length * 5) + 10;
        if (patient.isbar?.shift_notes && patient.isbar.shift_notes.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("الأحداث السريرية الأخيرة:", 15, eventsY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            
            patient.isbar.shift_notes.slice(0, 5).forEach((event, index) => {
                const yPos = eventsY + 5 + (index * 5);
                if (yPos < 250) {
                    doc.text(`${event.time}: ${event.event}`, 20, yPos);
                }
            });
        }
        
        // العلامات الحيوية
        const vitalsY = eventsY + (patient.isbar?.shift_notes?.length > 0 ? 5 + (Math.min(5, patient.isbar.shift_notes.length) * 5) : 0) + 10;
        if (patient.isbar?.assessment?.vitals) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("ملخص العلامات الحيوية:", 15, vitalsY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(patient.isbar.assessment.vitals, 20, vitalsY + 5);
        }
        
        // قسم التوقيعات
        const signatureY = Math.min(vitalsY + 20, 260);
        doc.setDrawColor(200, 200, 200);
        doc.line(15, signatureY - 5, 195, signatureY - 5);
        
        doc.setFontSize(11);
        doc.text(`وقت الشفت: ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`, 15, signatureY);
        doc.text(`الممرض/الممرضة المسلمة: ${signature}`, 15, signatureY + 10);
        doc.text(`الممرض/الممرضة المستقبلة: ${receivingNurse}`, 15, signatureY + 20);
        
        // التذييل
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("نظام نورعيظم لتقارير الشفت - نظام التواصل SBAR", 105, 285, { align: "center" });
        doc.text("تواصل سريري دقيق وفي الوقت المناسب", 105, 288, { align: "center" });

        const fileName = `تقرير_شفت_${patient.fileNumber || 'غير_محدد'}_${Date.now().toString().slice(-6)}.pdf`;
        doc.save(fileName);
        
        return {
            success: true,
            fileName: fileName
        };
    }

    // تصدير ملخص المريض
    function exportPatientSummary(patient) {
        const content = `
ملخص حالة المريض
================

معلومات المريض:
--------------------
الاسم: ${patient.name}
الرقم الطبي: ${patient.fileNumber}
العمر: ${patient.age}
الغرفة: ${patient.roomNumber}
الحالة: ${patient.status === 'active' ? 'نشط' : 'مسلم'}
تاريخ القبول: ${patient.isbar?.identification?.admission_date || 'غير محدد'}

معلومات سريرية:
---------------------
التشخيص: ${patient.diagnosis}
الطبيب المعالج: ${patient.isbar?.identification?.consultant || 'غير محدد'}
الحساسيات: ${patient.isbar?.background?.allergy || 'لا يوجد'}
العزل: ${patient.isbar?.background?.infections_isolation || 'لا يوجد'}

الأدوية الحالية (${patient.medications?.length || 0}):
---------------------
${(patient.medications || []).map(med => `• ${med.name} - ${med.dosage} (${med.frequency})`).join('\n')}

الأحداث السريرية الأخيرة:
-----------------------
${(patient.isbar?.shift_notes || []).slice(0, 5).map(note => `• ${note.time}: ${note.event}`).join('\n')}

المهام المعلقة (${patient.todos?.filter(t => !t.completed).length || 0}):
-----------------
${(patient.todos?.filter(t => !t.completed) || []).map(todo => `• ${todo.text}`).join('\n')}

ملخص التقييم:
-------------------
مقياس غلاسكو: ${patient.isbar?.assessment?.gcs || '15'}
خطر السقوط: ${patient.isbar?.assessment?.fall_risk || 'منخفض'}
العلامات الحيوية: ${patient.isbar?.assessment?.vitals || 'غير محدد'}

خطة الرعاية:
-------------
${patient.isbar?.recommendations?.plan_of_care || 'استمرار الإدارة الحالية'}

تم الإنشاء بواسطة نظام نورعيظم السريري
${new Date().toLocaleString('ar-EG')}
الإصدار: 2.0.0
        `;

        downloadFile(content, `ملخص_${patient.fileNumber || 'غير_محدد'}.txt`, 'text/plain');
        
        return {
            success: true,
            fileName: `ملخص_${patient.fileNumber || 'غير_محدد'}.txt`
        };
    }

    // تصدير البيانات كـ CSV
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
        downloadFile(csvString, `${fileName}.csv`, 'text/csv');
        
        return {
            success: true,
            fileName: `${fileName}.csv`
        };
    }

    // دالة مساعدة لتحميل الملفات
    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // API العامة
    return {
        exportHandoverPDF,
        exportReportPDF,
        exportMedicationTablePDF,
        exportCarePlanPDF,
        exportShiftReportPDF,
        exportPatientSummary,
        exportAsCSV
    };
})();

window.PDFExport = PDFExport;