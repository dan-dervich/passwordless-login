console.log('yay')

function check_value(id, url){
    jQuery.ajax({
        url: `/${url}`,
        type: "GET",
        contentType: 'application/json; charset=utf-8',
        success: function (res) {
                const input_value = document.getElementById(id)
                console.log(res.docs.username)
                
            }
        })
}
const user_value = document.getElementById('username')
console.log(user_value);
user_value.addEventListener('change', check_value('username', 'users'))
// check_value('username', 'users')