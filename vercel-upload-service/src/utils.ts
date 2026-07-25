const Max_LEN = 6;

export function generate(){
    let ans = ""
    const subset = "1234567890qwertyuiopasdfghjklzxcvbnm"
    for (let i =0 ; i < Max_LEN ; i++){
        ans += subset[Math.floor(Math.random()* subset.length)]
    }
    return ans;
}