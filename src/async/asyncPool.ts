type List<T> = (...args:any[]) =>Promise<T>

export async function asyncPool<T>(limit:number,list:List<T>[]) {
    
}