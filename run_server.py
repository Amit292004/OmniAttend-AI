import sys
sys.path.insert(0, 'mainapp')
import uvicorn

if __name__ == '__main__':
    uvicorn.run('api.main:app', host='0.0.0.0', port=8000, env_file='.env')
