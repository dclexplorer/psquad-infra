#/bin/bash
export PATH=$PATH:/home/dcl/.pulumi/bin/:/home/dcl/.nvm/versions/node/v22.11.0/bin/

while IFS='=' read -r key value
do
  if [[ $key != "" ]]; then
    export "$key=$value"
  fi
done < .env

STACK_NAME="dev"

# Check if the stack exists
if pulumi stack select $STACK_NAME 2>/dev/null; then
    echo "Stack $STACK_NAME selected."
else
    echo "Stack $STACK_NAME does not exist. Creating it..."
    pulumi stack init $STACK_NAME
fi

pulumi config set deployToLocalstack true
pulumi up  --yes --non-interactive --refresh --replace '*'
