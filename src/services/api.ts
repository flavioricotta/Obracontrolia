import { supabase } from '../supabase';
import { Project, Expense, Category, Task, Product, ExpenseType, PaymentStatus } from '../../types';

// Helper to get current user
const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
};

export const api = {
    projects: {
        list: async (): Promise<Project[]> => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(p => ({
                id: p.id,
                name: p.name,
                address: p.address,
                startDate: p.start_date,
                endDate: p.end_date,
                budget: Number(p.budget),
                sqMeters: Number(p.sq_meters),
                type: p.type,
                notes: p.notes,
                createdAt: p.created_at,
                completedStages: p.completed_stages || [],
                currentStage: p.current_stage
            }));
        },

        get: async (id: number): Promise<Project | null> => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return null;

            return {
                id: data.id,
                name: data.name,
                address: data.address,
                startDate: data.start_date,
                endDate: data.end_date,
                budget: Number(data.budget),
                sqMeters: Number(data.sq_meters),
                type: data.type,
                notes: data.notes,
                createdAt: data.created_at,
                completedStages: data.completed_stages || [],
                currentStage: data.current_stage
            };
        },

        create: async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    name: project.name,
                    address: project.address,
                    start_date: project.startDate,
                    end_date: project.endDate,
                    budget: project.budget,
                    sq_meters: project.sqMeters,
                    type: project.type,
                    notes: project.notes
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                name: data.name,
                address: data.address,
                startDate: data.start_date,
                endDate: data.end_date,
                budget: Number(data.budget),
                sqMeters: Number(data.sq_meters),
                type: data.type,
                notes: data.notes,
                createdAt: data.created_at,
                completedStages: data.completed_stages || [],
                currentStage: data.current_stage
            };
        },

        update: async (id: number, project: Partial<Project>): Promise<void> => {
            const updateData: any = {};
            if (project.name) updateData.name = project.name;
            if (project.address) updateData.address = project.address;
            if (project.startDate) updateData.start_date = project.startDate;
            if (project.endDate) updateData.end_date = project.endDate;
            if (project.budget) updateData.budget = project.budget;
            if (project.sqMeters) updateData.sq_meters = project.sqMeters;
            if (project.type) updateData.type = project.type;
            if (project.notes) updateData.notes = project.notes;
            if (project.completedStages) updateData.completed_stages = project.completedStages;
            if (project.currentStage) updateData.current_stage = project.currentStage;


            const { error } = await supabase
                .from('projects')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
        },

        delete: async (id: number): Promise<void> => {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
        }
    },

    expenses: {
        list: async (projectId?: number): Promise<Expense[]> => {
            let query = supabase.from('expenses').select('*');

            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query.order('date', { ascending: false });

            if (error) throw error;

            return data.map(e => ({
                id: e.id,
                projectId: e.project_id,
                date: e.date,
                categoryId: e.category_id,
                supplier: e.supplier,
                responsible: e.responsible,
                paymentMethod: e.payment_method,
                status: e.status as PaymentStatus,
                dueDate: e.due_date,
                amountExpected: Number(e.amount_expected),
                amountPaid: Number(e.amount_paid),
                description: e.description,
                quantity: Number(e.quantity),
                unit: e.unit,
                receiptImages: e.receipt_images,
                createdAt: e.created_at
            }));
        },

        create: async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
            const { data, error } = await supabase
                .from('expenses')
                .insert({
                    project_id: expense.projectId,
                    category_id: expense.categoryId,
                    date: expense.date,
                    supplier: expense.supplier,
                    responsible: expense.responsible,
                    payment_method: expense.paymentMethod,
                    status: expense.status,
                    due_date: expense.dueDate,
                    amount_expected: expense.amountExpected,
                    amount_paid: expense.amountPaid,
                    description: expense.description,
                    quantity: expense.quantity,
                    unit: expense.unit,
                    receipt_images: expense.receiptImages
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                projectId: data.project_id,
                date: data.date,
                categoryId: data.category_id,
                supplier: data.supplier,
                responsible: data.responsible,
                paymentMethod: data.payment_method,
                status: data.status as PaymentStatus,
                dueDate: data.due_date,
                amountExpected: Number(data.amount_expected),
                amountPaid: Number(data.amount_paid),
                description: data.description,
                quantity: Number(data.quantity),
                unit: data.unit,
                receiptImages: data.receipt_images,
                createdAt: data.created_at
            };
        },

        update: async (id: number, expense: Partial<Expense>): Promise<void> => {
            const updateData: any = {};
            // Map fields manually to safe snake_case, avoiding spreading unknown props
            if (expense.categoryId !== undefined) updateData.category_id = expense.categoryId;
            if (expense.date !== undefined) updateData.date = expense.date;
            if (expense.supplier !== undefined) updateData.supplier = expense.supplier;
            if (expense.responsible !== undefined) updateData.responsible = expense.responsible;
            if (expense.paymentMethod !== undefined) updateData.payment_method = expense.paymentMethod;
            if (expense.status !== undefined) updateData.status = expense.status;
            if (expense.dueDate !== undefined) updateData.due_date = expense.dueDate;
            if (expense.amountExpected !== undefined) updateData.amount_expected = expense.amountExpected;
            if (expense.amountPaid !== undefined) updateData.amount_paid = expense.amountPaid;
            if (expense.description !== undefined) updateData.description = expense.description;
            if (expense.quantity !== undefined) updateData.quantity = expense.quantity;
            if (expense.unit !== undefined) updateData.unit = expense.unit;
            if (expense.receiptImages !== undefined) updateData.receipt_images = expense.receiptImages;

            const { error } = await supabase
                .from('expenses')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
        },

        delete: async (id: number): Promise<void> => {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
        }
    },

    categories: {
        list: async (): Promise<Category[]> => {
            const { data, error } = await supabase.from('categories').select('*');
            if (error) throw error;
            return data.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type as ExpenseType,
                isFixed: c.is_fixed
            }));
        }
    },

    tasks: {
        list: async (projectId: number): Promise<Task[]> => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return data.map(t => ({
                id: t.id,
                projectId: t.project_id,
                title: t.title,
                isDone: t.is_done,
                createdAt: t.created_at
            }));
        },

        create: async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    project_id: task.projectId,
                    title: task.title,
                    is_done: task.isDone
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                projectId: data.project_id,
                title: data.title,
                isDone: data.is_done,
                createdAt: data.created_at
            };
        },

        toggle: async (id: number, isDone: boolean): Promise<void> => {
            const { error } = await supabase
                .from('tasks')
                .update({ is_done: isDone })
                .eq('id', id);

            if (error) throw error;
        },

        delete: async (id: number): Promise<void> => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        }
    },

    products: {
        list: async (): Promise<Product[]> => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('price', { ascending: true }); // Default sort

            if (error) throw error;

            return data.map(p => ({
                id: p.id,
                storeId: p.store_id,
                name: p.name,
                description: p.description,
                price: Number(p.price),
                unit: p.unit,
                category: p.category,
                lastUpdated: p.last_updated
            }));
        },

        create: async (product: Omit<Product, 'id' | 'lastUpdated'>): Promise<Product> => {
            const { data, error } = await supabase
                .from('products')
                .insert({
                    store_id: product.storeId,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    unit: product.unit,
                    category: product.category
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                storeId: data.store_id,
                name: data.name,
                description: data.description,
                price: Number(data.price),
                unit: data.unit,
                category: data.category,
                lastUpdated: data.last_updated
            };
        },

        update: async (id: number, product: Partial<Product>): Promise<void> => {
            const updates: any = {};
            if (product.price !== undefined) updates.price = product.price;
            if (product.name !== undefined) updates.name = product.name;
            // Add other fields as needed

            const { error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },

        delete: async (id: number): Promise<void> => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
        }
    },

    checkout: {
        createPreference: async (items: { title: string, quantity: number, unit_price: number }[], payer: { name: string, email: string }) => {
            const { data, error } = await supabase.functions.invoke('create-preference', {
                body: { items, payer }
            });

            if (error) throw error;
            return data;
        }
    }
};
