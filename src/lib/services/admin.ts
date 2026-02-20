import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { AdminSubscription, Vehicle, Medication, Pet } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// --- Subscriptions ---

const convertSubscriptionFromFirestore = (doc: any): AdminSubscription => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        cost: data.cost,
        billingCycle: data.billingCycle,
        nextPaymentDate: convertTimestamp(data.nextPaymentDate) || new Date(),
        category: data.category,
        url: data.url,
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

export const addSubscription = async (
    userId: string,
    subData: Partial<Omit<AdminSubscription, 'id' | 'userId' | 'createdAt'>>
): Promise<string> => {
    if (!subData.name || !subData.cost || !subData.nextPaymentDate || !subData.billingCycle) {
        throw new Error('Missing required subscription fields');
    }

    const collRef = collection(db, COLLECTIONS.ADMIN_SUBSCRIPTIONS);
    const docRef = await addDoc(collRef, {
        ...subData,
        userId,
        nextPaymentDate: Timestamp.fromDate(subData.nextPaymentDate),
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateSubscription = async (subId: string, updates: Partial<AdminSubscription>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ADMIN_SUBSCRIPTIONS, subId);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            if (value instanceof Date) cleanUpdates[key] = Timestamp.fromDate(value);
            else cleanUpdates[key] = value;
        }
    });
    await updateDoc(docRef, cleanUpdates);
};

export const deleteSubscription = async (subId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ADMIN_SUBSCRIPTIONS, subId));
};

export const subscribeToSubscriptions = (
    userId: string,
    callback: (subs: AdminSubscription[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const collRef = collection(db, COLLECTIONS.ADMIN_SUBSCRIPTIONS);
    const q = query(collRef, where('userId', '==', userId), orderBy('nextPaymentDate', 'asc'));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertSubscriptionFromFirestore)),
        (error) => {
            console.error('Error subscribing to subscriptions:', error);
            if (onError) onError(error);
        }
    );
};

// --- Vehicles ---

const convertVehicleFromFirestore = (doc: any): Vehicle => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        make: data.make,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        vin: data.vin,
        nextServiceDate: convertTimestamp(data.nextServiceDate),
        insuranceExpiry: convertTimestamp(data.insuranceExpiry),
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

export const addVehicle = async (
    userId: string,
    vehicleData: Partial<Omit<Vehicle, 'id' | 'userId' | 'createdAt'>>
): Promise<string> => {
    if (!vehicleData.make || !vehicleData.model || !vehicleData.year) {
        throw new Error('Missing required vehicle fields');
    }

    const collRef = collection(db, COLLECTIONS.ADMIN_VEHICLES);
    const docRef = await addDoc(collRef, {
        ...vehicleData,
        userId,
        nextServiceDate: vehicleData.nextServiceDate ? Timestamp.fromDate(vehicleData.nextServiceDate) : null,
        insuranceExpiry: vehicleData.insuranceExpiry ? Timestamp.fromDate(vehicleData.insuranceExpiry) : null,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ADMIN_VEHICLES, vehicleId);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            if (value instanceof Date) cleanUpdates[key] = Timestamp.fromDate(value);
            else cleanUpdates[key] = value;
        }
    });
    await updateDoc(docRef, cleanUpdates);
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ADMIN_VEHICLES, vehicleId));
};

export const subscribeToVehicles = (
    userId: string,
    callback: (vehicles: Vehicle[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const collRef = collection(db, COLLECTIONS.ADMIN_VEHICLES);
    const q = query(collRef, where('userId', '==', userId)); // Can't orderby easily if missing fields without index

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertVehicleFromFirestore)),
        (error) => {
            console.error('Error subscribing to vehicles:', error);
            if (onError) onError(error);
        }
    );
};

// --- Medications ---

const convertMedicationFromFirestore = (doc: any): Medication => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        refillDate: convertTimestamp(data.refillDate),
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

export const addMedication = async (
    userId: string,
    medData: Partial<Omit<Medication, 'id' | 'userId' | 'createdAt'>>
): Promise<string> => {
    if (!medData.name || !medData.dosage || !medData.frequency) {
        throw new Error('Missing required medication fields');
    }

    const collRef = collection(db, COLLECTIONS.ADMIN_MEDICATIONS);
    const docRef = await addDoc(collRef, {
        ...medData,
        userId,
        refillDate: medData.refillDate ? Timestamp.fromDate(medData.refillDate) : null,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateMedication = async (medId: string, updates: Partial<Medication>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ADMIN_MEDICATIONS, medId);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            if (value instanceof Date) cleanUpdates[key] = Timestamp.fromDate(value);
            else cleanUpdates[key] = value;
        }
    });
    await updateDoc(docRef, cleanUpdates);
};

export const deleteMedication = async (medId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ADMIN_MEDICATIONS, medId));
};

export const subscribeToMedications = (
    userId: string,
    callback: (meds: Medication[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const collRef = collection(db, COLLECTIONS.ADMIN_MEDICATIONS);
    const q = query(collRef, where('userId', '==', userId));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertMedicationFromFirestore)),
        (error) => {
            console.error('Error subscribing to meds:', error);
            if (onError) onError(error);
        }
    );
};

// --- Pets ---

const convertPetFromFirestore = (doc: any): Pet => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        species: data.species,
        breed: data.breed,
        birthDate: convertTimestamp(data.birthDate),
        nextVetVisit: convertTimestamp(data.nextVetVisit),
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

export const addPet = async (
    userId: string,
    petData: Partial<Omit<Pet, 'id' | 'userId' | 'createdAt'>>
): Promise<string> => {
    if (!petData.name || !petData.species) {
        throw new Error('Missing required pet fields');
    }

    const collRef = collection(db, COLLECTIONS.ADMIN_PETS);
    const docRef = await addDoc(collRef, {
        ...petData,
        userId,
        birthDate: petData.birthDate ? Timestamp.fromDate(petData.birthDate) : null,
        nextVetVisit: petData.nextVetVisit ? Timestamp.fromDate(petData.nextVetVisit) : null,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updatePet = async (petId: string, updates: Partial<Pet>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ADMIN_PETS, petId);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            if (value instanceof Date) cleanUpdates[key] = Timestamp.fromDate(value);
            else cleanUpdates[key] = value;
        }
    });
    await updateDoc(docRef, cleanUpdates);
};

export const deletePet = async (petId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ADMIN_PETS, petId));
};

export const subscribeToPets = (
    userId: string,
    callback: (pets: Pet[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const collRef = collection(db, COLLECTIONS.ADMIN_PETS);
    const q = query(collRef, where('userId', '==', userId));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertPetFromFirestore)),
        (error) => {
            console.error('Error subscribing to pets:', error);
            if (onError) onError(error);
        }
    );
};
