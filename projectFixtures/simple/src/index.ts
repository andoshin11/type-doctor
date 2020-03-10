// import * as https from 'https' <- this import statement will crash the compiler somehow :thinking_face:

function say(input: number) {
  console.log(input)
}

say1('hello')

const hoge = 'hoge'
hoge = 'fuga'

const fuga = 'fuga'
fuga = 'hoge'
