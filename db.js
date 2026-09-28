/* ============================================================
   DB.JS — Firestore data layer shared by all 3 pages
   Collections:
     settings/main        -> company info + hero stats (single doc)
     projects/{id}         -> real estate projects
     gallery/{id}           -> gallery images
     testimonials/{id}      -> customer testimonials
     enquiries/{id}          -> public enquiry form submissions
     siteVisits/{id}          -> site visit bookings
     leads/{id}                -> sales leads (assigned to a manager)
     customers/{id}              -> converted/booked customers
     followUps/{id}                -> follow-up reminders
     managers/{id}                   -> associate/manager profiles
     users/{uid}                        -> role lookup: 'admin' | 'manager'
   ============================================================ */
const FieldValue = firebase.firestore.FieldValue;
const timestamp = () => FieldValue.serverTimestamp();

function toArray(snap) {
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

const DB = {
    // ---------------- SETTINGS (company info, hero stats) ----------------
    async getSettings() {
        const doc = await db.collection('settings').doc('main').get();
        return doc.exists ? doc.data() : null;
    },
    async saveSettings(data) {
        await db.collection('settings').doc('main').set(data, { merge: true });
    },

    // ---------------- PROJECTS ----------------
    async getProjects() {
        const snap = await db.collection('projects').orderBy('createdAt', 'desc').get();
        return toArray(snap);
    },
    async getProject(id) {
        const doc = await db.collection('projects').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async addProject(data) {
        return db.collection('projects').add({ ...data, createdAt: timestamp() });
    },
    async updateProject(id, data) {
        await db.collection('projects').doc(id).update(data);
    },
    async deleteProject(id) {
        await db.collection('projects').doc(id).delete();
    },

    // ---------------- GALLERY ----------------
    async getGallery() {
        const snap = await db.collection('gallery').orderBy('createdAt', 'desc').get();
        return toArray(snap);
    },
    async addGalleryImage(url) {
        return db.collection('gallery').add({ url, createdAt: timestamp() });
    },
    async deleteGalleryImage(id) {
        await db.collection('gallery').doc(id).delete();
    },

    // ---------------- TESTIMONIALS ----------------
    async getTestimonials() {
        const snap = await db.collection('testimonials').orderBy('createdAt', 'desc').get();
        return toArray(snap);
    },
    async addTestimonial(data) {
        return db.collection('testimonials').add({ ...data, createdAt: timestamp() });
    },
    async deleteTestimonial(id) {
        await db.collection('testimonials').doc(id).delete();
    },

    // ---------------- ENQUIRIES (public form, no login needed) ----------------
    async submitEnquiry(data) {
        return db.collection('enquiries').add({ ...data, status: 'new', createdAt: timestamp() });
    },
    async getEnquiries() {
        const snap = await db.collection('enquiries').orderBy('createdAt', 'desc').get();
        return toArray(snap);
    },

    // ---------------- SITE VISITS ----------------
    async submitSiteVisit(data) {
        return db.collection('siteVisits').add({ ...data, status: 'scheduled', managerId: data.managerId || '', createdAt: timestamp() });
    },
    async getSiteVisits(managerId) {
        let ref = db.collection('siteVisits').orderBy('createdAt', 'desc');
        if (managerId) ref = db.collection('siteVisits').where('managerId', '==', managerId);
        const snap = await ref.get();
        return toArray(snap);
    },
    async updateSiteVisit(id, data) {
        await db.collection('siteVisits').doc(id).update(data);
    },

    // ---------------- LEADS ----------------
    async getLeads(managerId) {
        let ref = managerId ? db.collection('leads').where('managerId', '==', managerId) : db.collection('leads');
        const snap = await ref.get();
        return toArray(snap).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    async addLead(data) {
        return db.collection('leads').add({ ...data, createdAt: timestamp() });
    },
    async updateLead(id, data) {
        await db.collection('leads').doc(id).update(data);
    },
    async deleteLead(id) {
        await db.collection('leads').doc(id).delete();
    },

    // ---------------- CUSTOMERS ----------------
    async getCustomers(managerId) {
        let ref = managerId ? db.collection('customers').where('managerId', '==', managerId) : db.collection('customers');
        const snap = await ref.get();
        return toArray(snap).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    async addCustomer(data) {
        return db.collection('customers').add({ ...data, createdAt: timestamp() });
    },
    async updateCustomer(id, data) {
        await db.collection('customers').doc(id).update(data);
    },

    // ---------------- FOLLOW-UPS ----------------
    async getFollowUps(managerId) {
        let ref = managerId ? db.collection('followUps').where('managerId', '==', managerId) : db.collection('followUps');
        const snap = await ref.get();
        return toArray(snap).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    },
    async addFollowUp(data) {
        return db.collection('followUps').add({ ...data, status: 'pending', createdAt: timestamp() });
    },
    async updateFollowUp(id, data) {
        await db.collection('followUps').doc(id).update(data);
    },
    async deleteFollowUp(id) {
        await db.collection('followUps').doc(id).delete();
    },

    // ---------------- MANAGERS / ASSOCIATES ----------------
    async getManagers() {
        const snap = await db.collection('managers').orderBy('createdAt', 'desc').get();
        return toArray(snap);
    },
    async getManager(id) {
        const doc = await db.collection('managers').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    /**
     * Creates a real Firebase Auth login for a new associate/manager
     * WITHOUT logging the admin out (uses the secondary app instance),
     * then creates their Firestore profile + role doc.
     */
    async addManagerWithLogin({ email, password, ...profile }) {
        const cred = await secondaryAuth.createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        await secondaryAuth.signOut(); // clean up the secondary session
        const managerRef = await db.collection('managers').add({
            ...profile, email, uid, status: 'active', createdAt: timestamp()
        });
        await db.collection('users').doc(uid).set({
            role: 'manager', managerId: managerRef.id, email
        });
        return managerRef;
    },
    async updateManager(id, data) {
        await db.collection('managers').doc(id).update(data);
    },
    async toggleManagerStatus(id, status) {
        await db.collection('managers').doc(id).update({ status });
    },

    // ---------------- AUTH / ROLE ----------------
    async getUserRole(uid) {
        const doc = await db.collection('users').doc(uid).get();
        return doc.exists ? doc.data() : null;
    },

    // ---------------- ONE-TIME SEED (run once from admin Settings) ----------------
    async seedIfEmpty() {
        const settingsDoc = await db.collection('settings').doc('main').get();
        if (settingsDoc.exists) return false; // already seeded

        await db.collection('settings').doc('main').set({
            companyName: 'AVYA DEVELOPER & CONSTRUCTION',
            phone: '+91-7651970593',
            email: 'avyahome103@gmail.com',
            address: 'Kohna, Old Jhunsi, Near Lotus Hospital, Puliya, Jhunsi, Prayagraj – 211019',
            statYears: '10+', statCustomers: '1250+', statSold: '2500+', statProjects: '3',
            amenities: ['Gated Society', 'Wide Roads', 'Street Lights', 'Electric Poles', 'Green Park', 'Drainage System']
        });

        const projects = [
            { name: 'Devprayagam Phase II', location: 'Kachari (Kolhai), Shankargarh, Prayagraj', category: 'residential', status: 'ongoing', desc: 'A premium residential development offering thoughtfully planned plots in a serene, well-connected location.', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', amenities: ['Gated Society', 'Wide Roads', 'Street Lights'] }
        ];
        for (const p of projects) await DB.addProject(p);

        return true;
    }
};
